import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qzwbyphqaspxrcgajkts.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6d2J5cGhxYXNweHJjZ2Fqa3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTA3NTAsImV4cCI6MjA4NTc2Njc1MH0.ZqCq0xvIn8rgoZAFJFUnup_xHvhDOqyy4v_wiYHZuZw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createServiceSupabaseClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
