import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = createServiceSupabaseClient();
    
    // Next.js 13.4+ では params を await する必要がある
    const { sessionId } = await params;

    const { data, error } = await supabase
      .from('counseling_sessions')
      .select(`
        id,
        session_date,
        status,
        staff_assessment,
        staff_prescription,
        customer:customer_id (id, name),
        stylist:stylist_id (id, name)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      date: data.session_date,
      status: data.status,
      hairCondition: data.staff_assessment,
      treatmentPlan: data.staff_prescription,
      assessment: data.staff_assessment,
      customer: data.customer,
      staff: data.stylist,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
