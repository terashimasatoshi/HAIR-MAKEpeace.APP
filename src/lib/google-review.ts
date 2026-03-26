export type StoreKey = 'takayanagi' | 'hanado';

const REVIEW_URLS: Record<StoreKey, string> = {
  takayanagi: 'https://g.page/r/Cfo_vaI3qVFhEAE/review',
  hanado: 'https://g.page/r/CeRGyjes7J_QEAE/review',
};

export const getReviewUrl = (storeKey: StoreKey): string | null => {
  return REVIEW_URLS[storeKey] || null;
};

// store_id からストアキーを判定
// 花堂店: d7f4bd2c-69a2-4caf-a717-4a70615b47e6
// データに店舗情報がない場合はデフォルトで高柳店を使用
const STORE_ID_MAP: Record<string, StoreKey> = {
  'd7f4bd2c-69a2-4caf-a717-4a70615b47e6': 'hanado',
};

export const getStoreKeyFromId = (storeId?: string): StoreKey => {
  if (storeId && STORE_ID_MAP[storeId]) {
    return STORE_ID_MAP[storeId];
  }
  return 'takayanagi'; // デフォルト: 高柳店
};
