import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = createServiceSupabaseClient();
    const { sessionId } = await params;

    console.log('Completing session:', sessionId);

    const { data: session, error: sessionError } = await supabase
      .from('counseling_sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select('customer_id')
      .single();

    if (sessionError) {
      console.error('Session update error:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    console.log('Session completed, customer_id:', session.customer_id);

    const { data: customer, error: customerFetchError } = await supabase
      .from('customers')
      .select('visit_count')
      .eq('id', session.customer_id)
      .single();

    if (customerFetchError) {
      console.error('Customer fetch error:', customerFetchError);
      return NextResponse.json({ error: customerFetchError.message }, { status: 500 });
    }

    const newVisitCount = (customer?.visit_count || 0) + 1;
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update({ 
        visit_count: newVisitCount,
        last_visit_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', session.customer_id);

    if (customerUpdateError) {
      console.error('Customer update error:', customerUpdateError);
      return NextResponse.json({ error: customerUpdateError.message }, { status: 500 });
    }

    console.log('Customer visit_count updated to:', newVisitCount);

    return NextResponse.json({ 
      success: true,
      visitCount: newVisitCount
    });
  } catch (err) {
    console.error('Complete API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
