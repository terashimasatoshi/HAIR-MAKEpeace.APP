import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();

    // 今日の0時（UTC）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('counseling_sessions')
      .select(`
        id,
        customer_id,
        selected_menus,
        created_at,
        status,
        ai_suggestion,
        customer:customer_id(name),
        stylist:stylist_id(name)
      `)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Pending sessions query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // AI診断済み & 未完了のみ、顧客ごとに最新1件
    const seen = new Set<string>();
    const sessions = (data || [])
      .filter((s) => {
        if (s.ai_suggestion == null) return false;
        if (s.status === 'completed') return false;
        return true;
      })
      .filter((s) => {
        if (seen.has(s.customer_id)) return false;
        seen.add(s.customer_id);
        return true;
      })
      .map((s) => {
        const rawCustomer = s.customer as unknown;
        const cust = Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer;
        const rawStylist = s.stylist as unknown;
        const sty = Array.isArray(rawStylist) ? rawStylist[0] : rawStylist;
        return {
          id: s.id,
          customerId: s.customer_id,
          customerName: (cust as { name: string } | null)?.name || '不明',
          selectedMenus: (s.selected_menus as string[]) || [],
          createdAt: s.created_at,
          stylistName: (sty as { name: string } | null)?.name || null,
        };
      });

    return NextResponse.json(sessions);
  } catch (err) {
    console.error('Pending sessions API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
