/**
 * 内部APIコール用のfetchラッパー
 *
 * クライアントコンポーネントから /api/* を呼ぶ場合はこの関数を使うこと。
 * - ブラウザが自動的にOriginヘッダーを付与（Same-Originチェック用）
 * - CSRFトークンを自動取得・キャッシュして x-csrf-token ヘッダーに付与
 */

let csrfTokenCache = "";
let csrfFetchPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;

  // 重複リクエスト防止
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = fetch("/api/csrf")
    .then(async (res) => {
      if (!res.ok) return "";
      const data = await res.json();
      csrfTokenCache = data.token || "";
      return csrfTokenCache;
    })
    .catch(() => "")
    .finally(() => {
      csrfFetchPromise = null;
    });

  return csrfFetchPromise;
}

export async function fetchApi(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  // CSRFトークンを付与
  const token = await getCsrfToken();
  if (token) {
    headers.set("x-csrf-token", token);
  }

  const res = await fetch(url, { ...options, headers });

  // 401の場合、トークンが期限切れの可能性 → キャッシュクリアしてリトライ
  if (res.status === 401 && csrfTokenCache) {
    csrfTokenCache = "";
    const newToken = await getCsrfToken();
    if (newToken) {
      headers.set("x-csrf-token", newToken);
      return fetch(url, { ...options, headers });
    }
  }

  return res;
}
