import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { verifyApiSecret } from '@/lib/api-guard';

// セッション作成
export async function POST(request: Request) {
  const authError = await verifyApiSecret(request);
  if (authError) return authError;
  try {
    const supabase = createServiceSupabaseClient();
    const body = await request.json();
    
    const storeId = body.storeId || process.env.DEFAULT_STORE_ID;
    const staffId = body.staffId || process.env.DEFAULT_STAFF_ID;

    if (!body.customerId || !storeId || !staffId) {
      return NextResponse.json(
        { error: 'customerId, storeId, staffId は必須です' },
        { status: 400 }
      );
    }

    // 1. セッションを作成
    const { data, error } = await supabase
      .from('counseling_sessions')
      .insert({
        customer_id: body.customerId,
        stylist_id: staffId,
        store_id: storeId,
        session_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    return NextResponse.json({
      id: data.id,
      customerId: data.customer_id,
      status: 'draft',
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
