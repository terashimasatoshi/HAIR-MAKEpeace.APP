import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

// スタッフ所見を保存
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createServiceSupabaseClient();
    const body = await request.json();
    
    console.log('Saving staff assessment for session:', sessionId);
    console.log('Data:', body);
    
    const { data, error } = await supabase
      .from('counseling_sessions')
      .update({
        staff_assessment: {
          assessmentNotes: body.assessmentNotes || '',
          concerns: body.concerns || '',
          customerRequests: body.customerRequests || '',
          updatedAt: new Date().toISOString(),
        }
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Staff assessment saved:', data.staff_assessment);

    return NextResponse.json({ success: true, data: data.staff_assessment });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// スタッフ所見を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createServiceSupabaseClient();
    
    const { data, error } = await supabase
      .from('counseling_sessions')
      .select('staff_assessment')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data?.staff_assessment || null);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
