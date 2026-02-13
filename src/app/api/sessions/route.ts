import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

// セッション作成
export async function POST(request: Request) {
  try {
    const supabase = createServiceSupabaseClient();
    const body = await request.json();
    
    console.log('Creating session for customer:', body.customerId);
    
    // 実際のstore_idとstylist_idを使用（花堂店、寺嶋聡史）
    const defaultStoreId = 'd7f4bd2c-69a2-4caf-a717-4a70615b47e6';
    const defaultStaffId = '3a71d761-c4da-4eef-b938-a383a576ec13';
    
    // 1. セッションを作成
    const { data, error } = await supabase
      .from('counseling_sessions')
      .insert({
        customer_id: body.customerId,
        stylist_id: body.staffId || defaultStaffId,
        store_id: body.storeId || defaultStoreId,
        session_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Session created:', data);

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
