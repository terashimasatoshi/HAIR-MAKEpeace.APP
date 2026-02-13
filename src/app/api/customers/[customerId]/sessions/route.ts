import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const supabase = createServiceSupabaseClient();
    const { customerId } = await params;
    
    console.log('Fetching sessions for customer:', customerId);

    const { data, error } = await supabase
      .from('counseling_sessions')
      .select(`
        id,
        session_date,
        status,
        created_at,
        staff_assessment,
        staff_prescription,
        stylist:stylist_id (
          id,
          name
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Found sessions:', data?.length);

    const sessions = (data || []).map((row: any) => {
      let summary = '記録あり';
      try {
        summary = summarizeAssessment(row.staff_assessment);
      } catch (e) {
        console.log('Summary error for session:', row.id, e);
      }
      
      return {
        id: row.id,
        date: row.session_date,
        status: row.status || 'completed',
        createdAt: row.created_at,
        staffName: row.stylist?.name || '不明',
        hairConditionSummary: row.staff_assessment ? summary : null,
        treatmentSummary: row.staff_prescription?.selectedMenu?.name || null,
      };
    });

    return NextResponse.json(sessions);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function summarizeAssessment(assessment: any): string {
  if (!assessment) return '記録あり';
  
  const parts = [];
  
  // ダメージレベル
  if (assessment.damageLevel) {
    const labels: Record<number, string> = {1:'ダメージ少',2:'軽度',3:'中度',4:'やや強',5:'強'};
    parts.push(labels[assessment.damageLevel] || '');
  }
  
  // クセレベル
  if (assessment.curlLevel) {
    const labels: Record<number, string> = {1:'直毛',2:'ややクセ',3:'クセあり',4:'強め',5:'縮毛'};
    parts.push(labels[assessment.curlLevel] || '');
  }
  
  // concerns - 配列かどうかチェック
  if (assessment.concerns) {
    if (Array.isArray(assessment.concerns) && assessment.concerns.length > 0) {
      parts.push(assessment.concerns.slice(0, 2).join('・'));
    } else if (typeof assessment.concerns === 'string') {
      parts.push(assessment.concerns);
    } else if (typeof assessment.concerns === 'object') {
      // オブジェクトの場合はキーや値を取得
      const values = Object.values(assessment.concerns).filter(Boolean);
      if (values.length > 0) {
        parts.push(String(values.slice(0, 2).join('・')));
      }
    }
  }
  
  return parts.filter(Boolean).join(' / ') || '記録あり';
}
