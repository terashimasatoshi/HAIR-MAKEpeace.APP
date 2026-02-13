import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

// 顧客一覧取得
export async function GET(request: Request) {
  try {
    const supabase = createServiceSupabaseClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('customers')
      .select('*')
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Fetched customers:', data);

    // フロントエンド用に変換（実際のvisit_countを使用）
    const customers = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      lineUserId: row.line_user_id,
      visitCount: row.visit_count || 1,
      lastVisitDate: row.last_visit_date 
        ? new Date(row.last_visit_date).toLocaleDateString('ja-JP')
        : null,
    }));

    return NextResponse.json(customers);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// 新規顧客作成
export async function POST(request: Request) {
  try {
    const supabase = createServiceSupabaseClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: body.name,
        phone: body.phone || null,
        line_user_id: body.lineUserId || null,
        visit_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      phone: data.phone,
      visitCount: 0,
    });
  } catch (err) {
    console.error('API POST error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
