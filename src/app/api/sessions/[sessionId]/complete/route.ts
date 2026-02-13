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

    return NextResponse.json({ 
      success: true,
      sessionId
    });
  } catch (err) {
    console.error('Complete API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
