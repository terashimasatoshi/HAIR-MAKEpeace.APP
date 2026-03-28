import { NextResponse } from "next/server";

/**
 * APIルート保護: 内部APIシークレットの検証
 *
 * 全てのAPIルートのハンドラ冒頭で呼び出す。
 * クライアント側は fetchApi() 経由でリクエストすることで自動的にヘッダーが付与される。
 *
 * 環境変数 INTERNAL_API_SECRET が未設定の場合はガードをスキップ（開発時の利便性）
 */
export function verifyApiSecret(request: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;

  // 環境変数未設定ならスキップ（ローカル開発用）
  if (!secret) return null;

  const provided = request.headers.get("x-api-secret");

  if (provided !== secret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

/**
 * 簡易インメモリレート制限
 *
 * AI系APIルート（Claude/Gemini呼び出し）でコスト悪用を防止。
 * IPベースで一定期間内のリクエスト数を制限する。
 *
 * 注: Vercel Serverless Functionsはインスタンスが再利用されるため
 * 完全ではないが、大量スパムには有効。
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 10; // 1分あたり最大10リクエスト

export function checkRateLimit(request: Request): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "リクエスト回数の上限に達しました。しばらく待ってからお試しください。" },
      { status: 429 }
    );
  }

  return null;
}

// 古いエントリを定期的にクリーン（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);
