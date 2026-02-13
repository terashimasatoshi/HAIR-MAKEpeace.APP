import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = createServiceSupabaseClient();
    const { sessionId } = await params;
    const body = await request.json();
    const { staffPrescription } = body;

    console.log('Reviewing staff prescription for session:', sessionId);

    const { data: hairCondition } = await supabase
      .from('hair_conditions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('timing', 'before')
      .single();

    console.log('Calling Claude API for review...');
    
    const systemPrompt = `あなたはMETEO髪質改善の専門家です。スタッフが選んだ薬剤処方をレビューしてください。

髪の状態:
- 根元: ダメージLv.${hairCondition?.root_damage || 3}, くせ: ${hairCondition?.root_curl || 'straight'}
- 中間: ダメージLv.${hairCondition?.middle_damage || 3}, くせ: ${hairCondition?.middle_curl || 'straight'}  
- 毛先: ダメージLv.${hairCondition?.ends_damage || 3}, くせ: ${hairCondition?.ends_curl || 'straight'}
- ブリーチ: ${hairCondition?.bleach_count || 'none'}
- 縮毛矯正: ${hairCondition?.has_straightening ? 'あり' : 'なし'}

スタッフの処方:
${JSON.stringify(staffPrescription, null, 2)}

以下のJSON形式で回答してください:
{
  "overall": "ok" | "caution" | "warning",
  "sections": {
    "root": { "status": "ok" | "caution" | "warning", "message": "コメント" },
    "middle": { "status": "ok" | "caution" | "warning", "message": "コメント" },
    "ends": { "status": "ok" | "caution" | "warning", "message": "コメント" }
  },
  "suggestions": ["提案1", "提案2"],
  "warnings": ["警告があれば"]
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: 'スタッフの処方をレビューしてください。' }
      ],
      system: systemPrompt
    });

    const aiText = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Claude review response length:', aiText.length);

    let review;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      review = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall: 'ok', sections: {}, suggestions: [] };
      console.log('Successfully parsed AI review');
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      review = { overall: 'ok', sections: {}, suggestions: [], warnings: [] };
    }

    const { error: updateError } = await supabase
      .from('counseling_sessions')
      .update({
        staff_prescription: staffPrescription,
        ai_review: review,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to save review:', updateError);
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error('Review API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
