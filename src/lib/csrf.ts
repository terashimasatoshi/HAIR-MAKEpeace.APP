/**
 * CSRF トークン生成・検証
 *
 * HMAC-SHA256で署名したタイムスタンプトークンを使い、
 * クライアントから送られるリクエストが正規のアプリ経由であることを検証する。
 *
 * - トークンは API Route `/api/csrf` で発行（サーバーサイドで生成）
 * - クライアントは fetchApi() 経由で自動的にヘッダーに付与
 * - サーバーの verifyApiSecret() でOriginチェック + CSRF検証の二重防御
 *
 * トークン有効期限: 24時間
 */

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function getSecret(): string {
  // CSRF_SECRET が未設定の場合は SUPABASE_SERVICE_ROLE_KEY のハッシュを利用
  // （別途専用のシークレットを設定することを推奨）
  return process.env.CSRF_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export async function generateCsrfToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) return "";

  const timestamp = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${timestamp}.${hex}`;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, providedHex] = parts;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  // 有効期限チェック
  if (Date.now() - ts > TOKEN_MAX_AGE_MS) return false;

  // 署名検証
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  const expectedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 定数時間比較（タイミング攻撃防止）
  if (providedHex.length !== expectedHex.length) return false;
  const a = new TextEncoder().encode(providedHex);
  const b = new TextEncoder().encode(expectedHex);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
