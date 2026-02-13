export const ENABLE_LOCAL_FALLBACK =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_FALLBACK === 'true' ||
  process.env.NODE_ENV !== 'production';

