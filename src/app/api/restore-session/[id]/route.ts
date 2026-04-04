import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceSupabaseClient();
    const { id } = await params;

    const { data: session, error } = await supabase
      .from('counseling_sessions')
      .select('*, customer:customer_id(id, name, kana, age, phone)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Restore session query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (err) {
    console.error('Restore session API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
