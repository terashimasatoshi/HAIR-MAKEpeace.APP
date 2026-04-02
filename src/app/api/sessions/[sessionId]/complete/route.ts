import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { verifyApiSecret } from '@/lib/api-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authError = await verifyApiSecret(request);
  if (authError) return authError;
  try {
    const supabase = createServiceSupabaseClient();
    const { sessionId } = await params;


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


    return NextResponse.json({ 
      success: true,
      sessionId
    });
  } catch (err) {
    console.error('Complete API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
