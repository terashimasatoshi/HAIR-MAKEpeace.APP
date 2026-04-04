import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const supabase = createServiceSupabaseClient();
    const { customerId } = await params;

    // JST (UTC+9) の今日0:00をUTCで計算
    const now = new Date();
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const nowInJST = new Date(now.getTime() + JST_OFFSET_MS);
    nowInJST.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(nowInJST.getTime() - JST_OFFSET_MS);

    const { data, error } = await supabase
      .from('counseling_sessions')
      .select('id')
      .eq('customer_id', customerId)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Latest session query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data?.id || null });
  } catch (err) {
    console.error('Latest session API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
