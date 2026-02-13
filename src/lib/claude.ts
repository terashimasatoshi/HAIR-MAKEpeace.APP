import Anthropic from '@anthropic-ai/sdk';
import type { AITreatmentPlan, HairConditionBySection, TreatmentHistory, StaffAssessment } from '@/types/counseling';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const METEO_SYSTEM_PROMPT = `あなたは「HAIR&MAKE peace」の髪質改善スペシャリストです。
METEOストレート・カラー技術を使用した最適な施術プランを提案してください。`;

interface GeneratePlanInput {
  beforeCondition: HairConditionBySection;
  treatmentHistory: TreatmentHistory;
  staffAssessment: StaffAssessment;
  knowledgeBase?: string;
}

export async function generateTreatmentPlan(input: GeneratePlanInput): Promise<AITreatmentPlan> {
  const { beforeCondition, treatmentHistory, staffAssessment, knowledgeBase } = input;
  
  const userPrompt = `
【髪の現状】
根本: ダメージレベル${beforeCondition.root.damage}、くせ: ${beforeCondition.root.curl}
中間: ダメージレベル${beforeCondition.middle.damage}、くせ: ${beforeCondition.middle.curl}
毛先: ダメージレベル${beforeCondition.ends.damage}、くせ: ${beforeCondition.ends.curl}

【施術履歴】
- 最終カラー: ${treatmentHistory.lastColor}
- ブリーチ回数: ${treatmentHistory.bleachCount}
- 最終縮毛矯正: ${treatmentHistory.lastStraightening}

【スタッフ所見】
- 全体評価: ${staffAssessment.overallCondition}
- 懸念事項: ${staffAssessment.concerns.join(', ')}

上記の情報をもとに、最適な施術プランをJSON形式で提案してください。
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: METEO_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Claude APIからテキストレスポンスが返されませんでした');
    }

    let jsonText = textContent.text;
    const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const plan: AITreatmentPlan = JSON.parse(jsonText);
    return plan;
  } catch (error) {
    console.error('Claude API呼び出しエラー:', error);
    throw new Error('施術プランの生成に失敗しました');
  }
}
