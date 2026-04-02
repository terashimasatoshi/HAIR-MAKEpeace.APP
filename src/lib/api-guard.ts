import { NextResponse } from "next/server";
import { verifyCsrfToken } from "./csrf";

/**
 * APIルート保護: Origin/Referer + CSRFトークンの二重検証
 *
 * 全てのAPIルートのハンドラ冒頭で呼び出す。
 * 1. Origin/Refererがアプリのホストと一致（ブラウザ同一オリジン）
 * 2. x-csrf-token ヘッダーにサーバー発行のHMAC署名トークン
 * 両方を満たすリクエストのみ許可する。
 *
 * 開発環境（NODE_ENV=development）ではスキップする。
 */
export async function verifyApiSecret(request: Request): Promise<NextResponse | null> {
  // 開発環境ではスキップ
  if (process.env.NODE_ENV === "development") return null;

  const allowedHosts = buildAllowedHosts();

  // fail-closed: ホワイトリストが空なら即401
  if (allowedHosts.size === 0) {
    console.error("[API guard misconfigured] No allowed hosts configured — blocking all requests");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Origin/Referer チェック
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  let originOk = false;

  if (origin) {
    const host = safeHostname(origin);
    if (host && allowedHosts.has(host)) originOk = true;
  }
  if (!originOk && referer) {
    const host = safeHostname(referer);
    if (host && allowedHosts.has(host)) originOk = true;
  }

  if (!originOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. CSRFトークン検証
  const csrfToken = request.headers.get("x-csrf-token") || "";
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function buildAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  const envVars = [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.NEXT_PUBLIC_APP_DOMAIN,
  ];

  for (const val of envVars) {
    if (!val) continue;
    // プロトコルがあればパース、なければそのままホスト名として扱う
    const hostname = val.replace(/^https?:\/\//, "").split("/")[0];
    if (hostname) hosts.add(hostname);
  }

  return hosts;
}

function safeHostname(urlOrOrigin: string): string | null {
  try {
    return new URL(urlOrOrigin).hostname;
  } catch {
    return null;
  }
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
