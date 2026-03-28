import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

// クライアント側で使用する匿名キーのSupabaseクライアント
let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();
      if (url && key) {
        _supabase = createClient(url, key);
      } else {
        throw new Error('Supabase URL and Anon Key must be set in environment variables');
      }
    }
    return (_supabase as unknown as Record<string, unknown>)[prop as string];
  }
});

// サーバー側で使用するService Roleキーのクライアント（API Route専用）
export class SupabaseConfigError extends Error {
  constructor() {
    super('Database configuration error');
    this.name = 'SupabaseConfigError';
  }
}

export function createServiceSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    throw new SupabaseConfigError();
  }
  return createClient(url, serviceKey);
}
