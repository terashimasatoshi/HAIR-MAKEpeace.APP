/**
 * 内部APIコール用のfetchラッパー
 *
 * 自動的にAPIシークレットヘッダーを付与する。
 * クライアントコンポーネントから /api/* を呼ぶ場合はこの関数を使うこと。
 */
export async function fetchApi(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const secret = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || "";

  const headers = new Headers(options.headers);
  if (secret) {
    headers.set("x-api-secret", secret);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
