import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createServiceSupabaseClient();

    console.log('Generating AI plan for session:', sessionId);

    // 1. セッション情報を取得
    const { data: session, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*, customers(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // 2. 髪の状態を取得
    const { data: hairCondition, error: hairError } = await supabase
      .from('hair_conditions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('timing', 'before')
      .single();

    if (hairError && hairError.code !== 'PGRST116') throw hairError;

    // 3. Supabaseからナレッジベースを取得
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('category, title, content, priority')
      .like('category', 'meteo%')
      .order('priority', { ascending: false });

    if (knowledgeError) {
      console.error('Knowledge fetch error:', knowledgeError);
    }

    // ナレッジを結合
    const meteoKnowledge = knowledgeData
      ? knowledgeData.map(k => `## ${k.title}\n\n${k.content}`).join('\n\n---\n\n')
      : '（ナレッジデータ取得エラー）';

    console.log(`Loaded ${knowledgeData?.length || 0} knowledge entries`);

    // 4. プロンプトを構築
    const customerInfo = session.customers ? `顧客名: ${session.customers.name}` : '';

    const hairConditionText = hairCondition ? `
## 現在の髪の状態

**ダメージレベル（1=健康 〜 5=ハイダメージ）**
- 根元: ${hairCondition.root_damage}
- 中間: ${hairCondition.middle_damage}
- 毛先: ${hairCondition.ends_damage}

**くせ毛の強さ（none/weak/medium/strong）**
- 根元: ${hairCondition.root_curl}
- 中間: ${hairCondition.middle_curl}
- 毛先: ${hairCondition.ends_curl}

**施術履歴**
- 直近カラー: ${hairCondition.last_color || 'なし'}
- ブリーチ回数: ${hairCondition.bleach_count || 'なし'}
- 縮毛矯正履歴: ${hairCondition.has_straightening ? 'あり' : 'なし'}

**質感**
- ツヤレベル: ${hairCondition.shine_level}/5
- 質感: ${hairCondition.texture}
- まとまり: ${hairCondition.manageability}/5
` : '髪の状態データなし';

    const customerRequests = session.staff_assessment?.customerRequests || '';
    const staffAssessmentText = session.staff_assessment ? `
## スタッフ所見

- 状態の所見: ${session.staff_assessment.assessmentNotes || 'なし'}
- 注意点・懸念: ${session.staff_assessment.concerns || 'なし'}

## ★本日の要望（最重要）
${customerRequests ? customerRequests : '特になし（スタッフの判断で最適な施術を提案してください）'}
` : '';

    const prompt = `
あなたはHAIR&MAKE peaceの髪質改善専門AIカウンセラーです。
以下のMETEO施術マニュアルと顧客の髪の状態をもとに、最適な施術プランを提案してください。

【重要】
- ★「本日の要望」が記載されている場合は、その内容を最優先で考慮し、要望に沿った施術メニューと薬剤を提案すること
- 「本日の要望」が「特になし」の場合は、髪の状態とスタッフ所見をもとにスタッフの判断で最適な施術を提案すること
- 必ずナレッジの配合レシピ早見表を参照して、具体的な薬剤と配合量を提案すること
- 部位別（根元・中間・毛先）の塗り分けを必ず指定すること
- 中間処理の工程を必ず含めること
- アイロン温度は髪の状態に応じて具体的に指定すること
- 体力レベルはダメージレベルから変換すること（ダメージ5→体力0-2、ダメージ1→体力8-10）

=== METEOナレッジベース ===

${meteoKnowledge}

=== 顧客情報 ===

${customerInfo}

${hairConditionText}

${staffAssessmentText}

=== 出力形式 ===

【重要】以下のJSON形式のみを出力してください。説明文や前置きは不要です。
必ずダブルクォート(")を使用してください。数値は数字のみ（単位なし）で記述してください。

\`\`\`json
{
  "recommendedMenu": "メテオストレート＋カラー",
  "recommendedPrice": 29840,
  "durationMinutes": 180,
  "hairAnalysis": {
    "powerLevel": 6,
    "curlLevel": "普通",
    "zone": "アルカリゾーン",
    "riskFactors": ["ブリーチ履歴あり", "毛先ダメージ"]
  },
  "productSelection": {
    "root": { 
      "product": "ネオメテオクリーム10.5", 
      "amount": "60g",
      "incline": "12g",
      "ritpinoH": "6g",
      "reason": "新生部は体力があるためアルカリ領域で対応" 
    },
    "middle": { 
      "product": "ネオメテオクリーム7.0", 
      "amount": "60g",
      "incline": "6g",
      "ritpinoH": "0g",
      "reason": "カラー履歴を考慮し酸性領域で対応" 
    },
    "ends": { 
      "product": "ネオメテオクリーム4.5", 
      "amount": "60g",
      "incline": "0g",
      "ritpinoH": "0g",
      "reason": "ダメージ軽減のため酸性領域" 
    }
  },
  "treatmentProcess": [
    { "step": 1, "action": "カウンセリング・診断", "timeMinutes": 10, "details": "髪質診断・体力レベル判定", "notes": "ダメージ箇所を確認" },
    { "step": 2, "action": "シャンプー・前処理", "timeMinutes": 10, "details": "残留物除去、前処理剤塗布", "notes": "ダメージ部にPPT補給" },
    { "step": 3, "action": "1剤塗布", "timeMinutes": 20, "details": "根元→中間→毛先の順で塗り分け", "notes": "部位ごとに薬剤を変える" },
    { "step": 4, "action": "放置・軟化チェック", "timeMinutes": 20, "details": "15分で一度チェック、密歯コームで確認", "notes": "クセが残っていればハーツB重ね塗り" },
    { "step": 5, "action": "中間水洗", "timeMinutes": 5, "details": "ワンシャン後、エアンス・アンジー・ベルバフ重ね付け", "notes": "チェンジリンス" },
    { "step": 6, "action": "中間処理", "timeMinutes": 10, "details": "セルフォース・キトフォース・ケラフォース・ネクター塗布、ツインブラシで水抜き", "notes": "最重要工程" },
    { "step": 7, "action": "ドライ", "timeMinutes": 15, "details": "80%ドライ", "notes": "ビリビリ部分があれば再処理" },
    { "step": 8, "action": "アイロン", "timeMinutes": 30, "details": "200度以上で熱を置くイメージ", "temperature": "200", "notes": "決して引っ張らない" },
    { "step": 9, "action": "2剤・仕上げ", "timeMinutes": 10, "details": "酸化定着、後処理トリートメント", "notes": "" }
  ],
  "risksAndPrecautions": ["毛先のオーバープロセスに注意", "ブリーチ部分は温度を下げる"],
  "expectedResults": {
    "shine": "★★★★☆ 高いツヤ感",
    "texture": "なめらかで柔らかい手触り",
    "duration": "3〜4ヶ月持続"
  },
  "afterCare": {
    "immediate": "当日はシャンプーを避ける、結ばない、耳にかけない",
    "homeCare": "弱酸性シャンプー使用、しっかり乾かす"
  },
  "nextVisitRecommendation": "3ヶ月後にリタッチ推奨"
}
\`\`\`
`;

    console.log('Calling Claude API...');

    // 5. Claude APIを呼び出し
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // 6. レスポンスからJSONを安全にパース
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('Claude response length:', responseText.length);

    let plan;
    try {
      let jsonStr = responseText;

      // ```json ... ``` があれば抽出
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // { から } までを抽出
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      if (startIdx !== -1 && endIdx > startIdx) {
        jsonStr = jsonStr.slice(startIdx, endIdx + 1);
      }

      plan = JSON.parse(jsonStr.trim());
      console.log('Successfully parsed AI plan');
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response (first 800 chars):', responseText.substring(0, 800));

      // フォールバックプラン
      plan = {
        recommendedMenu: "メテオトリートメント",
        recommendedPrice: 16500,
        durationMinutes: 120,
        hairAnalysis: { powerLevel: 5, curlLevel: "要確認", zone: "要確認", riskFactors: ["AI解析エラー - 手動確認必要"] },
        productSelection: {
          root: { product: "ネオメテオクリーム10.5", amount: "60g", incline: "6g", ritpinoH: "0g", reason: "標準処方" },
          middle: { product: "ネオメテオクリーム7.0", amount: "60g", incline: "6g", ritpinoH: "0g", reason: "標準処方" },
          ends: { product: "ネオメテオクリーム4.5", amount: "60g", incline: "0g", ritpinoH: "0g", reason: "ダメージケア" }
        },
        treatmentProcess: [
          { step: 1, action: "前処理", timeMinutes: 10, details: "", notes: "" },
          { step: 2, action: "薬剤塗布", timeMinutes: 20, details: "", notes: "" },
          { step: 3, action: "放置・チェック", timeMinutes: 20, details: "", notes: "" },
          { step: 4, action: "中間水洗", timeMinutes: 5, details: "", notes: "" },
          { step: 5, action: "中間処理", timeMinutes: 10, details: "", notes: "" },
          { step: 6, action: "ドライ", timeMinutes: 15, details: "", notes: "" },
          { step: 7, action: "アイロン", timeMinutes: 30, temperature: "180", details: "", notes: "" },
          { step: 8, action: "2剤・仕上げ", timeMinutes: 20, details: "", notes: "" }
        ],
        risksAndPrecautions: ["プラン自動生成でエラー発生。手動で確認・調整してください。"],
        expectedResults: { shine: "要確認", texture: "要確認", duration: "要確認" },
        afterCare: { immediate: "当日シャンプー避ける", homeCare: "しっかり乾かす" },
        nextVisitRecommendation: "1.5〜2ヶ月後"
      };
    }

    // 7. セッションにプランを保存
    const { error: updateError } = await supabase
      .from('counseling_sessions')
      .update({
        ai_suggestion: plan,
        status: 'plan_generated'
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to save plan:', updateError);
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
