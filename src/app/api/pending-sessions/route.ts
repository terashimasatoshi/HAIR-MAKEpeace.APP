import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();

    // 今日の0時（JST = UTC+9）をUTCで計算
    const now = new Date();
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const nowInJST = new Date(now.getTime() + JST_OFFSET_MS);
    nowInJST.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(nowInJST.getTime() - JST_OFFSET_MS);

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

    // 未完了のみ、顧客ごとに最新1件（どのステップでも表示）
    const seen = new Set<string>();
    const sessions = (data || [])
      .filter((s) => {
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
        const menus = (s.selected_menus as string[]) || [];
        // データ内容からステップを判定
        let step: 'input' | 'menu' | 'plan' | 'treatment' = 'input';
        if (s.ai_suggestion != null) step = 'treatment';
        else if (menus.length > 0) step = 'plan';
        else if (s.status === 'in_progress') step = 'input';
        return {
          id: s.id,
          customerId: s.customer_id,
          customerName: (cust as { name: string } | null)?.name || '不明',
          selectedMenus: menus,
          createdAt: s.created_at,
          stylistName: (sty as { name: string } | null)?.name || null,
          step,
        };
      });

    return NextResponse.json(sessions);
  } catch (err) {
    console.error('Pending sessions API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
