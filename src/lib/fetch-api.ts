/**
 * 内部APIコール用のfetchラッパー
 *
 * クライアントコンポーネントから /api/* を呼ぶ場合はこの関数を使うこと。
 * Same-Originリクエストであればブラウザが自動的にOriginヘッダーを付与するため、
 * サーバー側のverifyApiSecret()でSame-Originチェックが行われる。
 */
export async function fetchApi(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
