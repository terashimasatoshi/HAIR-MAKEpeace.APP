import { NextResponse } from "next/server";

/**
 * APIルート保護: Same-Originリクエストの検証
 *
 * 全てのAPIルートのハンドラ冒頭で呼び出す。
 * ブラウザからの正規リクエスト（Origin/Refererがアプリのホストと一致）のみ許可する。
 *
 * 開発環境（NODE_ENV=development）ではスキップする。
 */
export function verifyApiSecret(request: Request): NextResponse | null {
  // 開発環境ではスキップ
  if (process.env.NODE_ENV === "development") return null;

  // fail-closed: ホスト設定が存在しなければ即401（設定漏れ事故防止）
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || "";
  const customDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "";
  if (!vercelUrl && !customDomain) {
    console.error("[API guard misconfigured] VERCEL_URL and NEXT_PUBLIC_APP_DOMAIN are both unset — blocking all requests");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // origin or referer いずれかがホワイトリストと完全一致すれば許可
  if (origin) {
    const originHost = safeHostname(origin);
    if (originHost && isAllowedHost(originHost, vercelUrl)) return null;
  }

  if (referer) {
    const refererHost = safeHostname(referer);
    if (refererHost && isAllowedHost(refererHost, vercelUrl)) return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function safeHostname(urlOrOrigin: string): string | null {
  try {
    return new URL(urlOrOrigin).hostname;
  } catch {
    return null;
  }
}

function isAllowedHost(hostname: string, vercelUrl: string): boolean {
  // 厳格ホワイトリスト: 完全一致のみ許可

  // VERCEL_URL（そのデプロイ固有のURL）と完全一致
  if (vercelUrl) {
    const vercelHostname = vercelUrl.replace(/^https?:\/\//, "").split("/")[0];
    if (hostname === vercelHostname) return true;
  }

  // NEXT_PUBLIC_APP_DOMAIN（本番カスタムドメイン）と完全一致
  const customDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (customDomain && hostname === customDomain) return true;

  return false;
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
