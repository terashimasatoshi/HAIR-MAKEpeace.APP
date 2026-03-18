type StoreKey = 'takayanagi' | 'hanado';

const PLACE_IDS: Record<StoreKey, string | undefined> = {
  takayanagi: process.env.NEXT_PUBLIC_PLACE_ID_TAKAYANAGI,
  hanado: process.env.NEXT_PUBLIC_PLACE_ID_HANADO,
};

export const getReviewUrl = (storeKey: StoreKey): string | null => {
  const placeId = PLACE_IDS[storeKey];
  if (!placeId) return null;
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
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
