import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { MATCHING_KNOWLEDGE } from '@/lib/knowledge';
import { verifyApiSecret, checkRateLimit } from '@/lib/api-guard';

export async function POST(request: Request) {
  const authError = await verifyApiSecret(request);
  if (authError) return authError;
  const rateLimitError = checkRateLimit(request);
  if (rateLimitError) return rateLimitError;
  try {
    const { gender, age, hairLength, lengthPreference, faceShape, personalColor, personalColorBase, concerns, request: customerRequest } = await request.json();
    const genderLabel = gender === 'male' ? '男性' : '女性';
    const ageLabel = age ? `${age}歳` : '不明';
    const HAIR_LENGTH_MAP: Record<string, string> = {
      'very-short': 'ベリーショート', 'short': 'ショート', 'bob': 'ボブ',
      'medium': 'ミディアム', 'long': 'ロング',
    };
    const hairLengthLabel = HAIR_LENGTH_MAP[hairLength] || '不明';
    const LENGTH_PREF_MAP: Record<string, string> = {
      'shorter': '短くしたい', 'slightly-shorter': '少し短くしたい',
      'keep': '現状維持', 'grow': '伸ばしたい',
    };
    const lengthPrefLabel = LENGTH_PREF_MAP[lengthPreference] || '特になし';
    const now = new Date();
    const month = now.getMonth() + 1;
    const SEASON_MAP: Record<number, string> = {
      1: '冬（1月）', 2: '冬（2月）', 3: '春（3月）',
      4: '春（4月）', 5: '春（5月）', 6: '夏（6月）',
      7: '夏（7月）', 8: '夏（8月）', 9: '秋（9月）',
      10: '秋（10月）', 11: '秋（11月）', 12: '冬（12月）',
    };
    const currentSeason = SEASON_MAP[month];

    // Check if API key is present, otherwise return mock
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not found, returning mock response");
      console.warn("ANTHROPIC_API_KEY not found, returning mock response");
      return NextResponse.json({
        summary: {
          faceShape: "卵型 (Mock)",
          personalColor: "ブルベ夏 (Mock)",
          matchRate: 88
        },
        colors: [{ name: "モックベージュ", code: "#E0C0A0", desc: "APIキーが設定されていないためモックデータを返しています" }],
        styles: [{ id: 1, title: "モックショート", desc: "APIキー未設定" }],
        advice: ["APIキーを設定してください", ".env.localを確認してください"],
        aiAnalysis: "これはモックレスポンスです。正しいAPIキーを設定すると、AIによる診断結果が表示されます。"
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `
You are a professional hair stylist.
Based on the following customer profile and the "Matching Knowledge", suggest suitable hair colors and styles.

# Matching Knowledge
${MATCHING_KNOWLEDGE}

# Customer Profile
- Gender: ${genderLabel}
- Age: ${ageLabel}
- Current Hair Length: ${hairLengthLabel}
- Length Preference: ${lengthPrefLabel}
- Current Season: ${currentSeason}
- Face Shape: ${faceShape} (Map this to one of: 面長, 丸顔, ベース型, 逆三角形. If "egg" or others, suggest generally balanced styles)
- Personal Color: ${personalColor}
- Personal Color Base: ${personalColorBase || 'unknown'}
- Concerns: ${concerns?.join(',')}
- Today's Request: ${customerRequest?.trim() ? customerRequest : 'なし'}

# Instructions
0. If "Today's Request" is provided, prioritize it first and adjust all suggestions to match it.
1. IMPORTANT: The customer is ${genderLabel}. All color suggestions, style suggestions, and advice MUST be appropriate for ${genderLabel}. For male customers, suggest masculine styles (short cuts, fades, textured styles, etc.) and natural/subtle color tones. For female customers, suggest a wider range of styles and colors.
2. The customer's age is ${ageLabel}. Suggest styles and colors appropriate for their age group. For example: 20s can handle bolder trends, 30-40s balance trend with sophistication, 50s+ prioritize elegance, volume, and gray coverage if needed. Never suggest overly youthful styles for older customers or overly mature styles for younger ones.
3. The customer's current hair length is ${hairLengthLabel} and their length preference is "${lengthPrefLabel}". This is critical for style suggestions:
   - "短くしたい": Suggest styles that are notably shorter than current length.
   - "少し短くしたい": Suggest styles slightly shorter, like trimming or one step down.
   - "現状維持": Keep similar length, suggest changes through layers, texture, color, or styling only.
   - "伸ばしたい": Do NOT suggest cutting shorter. Focus on maintaining health while growing, and suggest styles for the target longer length.
   - If no preference given, suggest a balanced mix.
4. Consider the current season (${currentSeason}). Reflect seasonal trends, seasonal color tones, and seasonally appropriate styling in your suggestions. For example: lighter/brighter tones for spring/summer, warmer/deeper tones for autumn/winter.
5. Analyze the customer's face shape using the Matching Knowledge.
6. Suggest "Out Form", "In Form", and "Bang" adjustments based on the knowledge.
7. Recommend 4 specific hair colors (varying tone: 明るめ1, ナチュラル1, 暗め1, トレンド1) and 5 styles organized by category.
8. Provide 4-5 concrete styling advice points.
9. Styles must cover different categories: 王道 (classic), トレンド (trend), 個性派 (unique), イメチェン (transformation), 楽ちん (easy maintenance). Pick 5 from these that suit the customer best.

Output must be a valid JSON object with the following structure:
{
  "summary": {
    "faceShape": "Customer's face shape (in Japanese)",
    "personalColor": "Customer's personal color (in Japanese)",
    "matchRate": 80-100 (integer)
  },
  "colors": [
    { "name": "Color Name", "code": "#HexCode", "desc": "Reason for recommendation", "tone": "明るめ|ナチュラル|暗め|トレンド" }
  ],
  "styles": [
    { "id": 1, "title": "Style Name", "desc": "Reason and how it suits the customer", "category": "王道|トレンド|個性派|イメチェン|楽ちん" }
  ],
  "advice": [
    "Advice point 1",
    "Advice point 2",
    "Advice point 3",
    "Advice point 4"
  ],
  "aiAnalysis": "Comprehensive advice paragraph (in Japanese). MUST include specific mentions of 'Out Form', 'In Form', and 'Bang' adjustments based on the face shape knowledge."
}
Return ONLY the JSON. Do not include markdown code block markers.
`
      }]
    });

    let content = "";
    if (message.content[0].type === 'text') {
      content = message.content[0].text;
    }

    // Clean up markdown if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const result = JSON.parse(content);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', content);

      // フォールバック応答
      return NextResponse.json({
        summary: {
          faceShape: "AI診断中...",
          personalColor: "診断中...",
          matchRate: 70
        },
        colors: [],
        styles: [],
        advice: ["AIの応答が不安定なため、完全な診断結果を表示できませんでした。", "スタイリストにご相談ください。"],
        aiAnalysis: "AIの生成テキストが長すぎたため、一部が切れてしまいました。もう一度試すか、スタイリストと直接相談しながら決めてください。"
      });
    }

  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return NextResponse.json({
      error: "AIサービスの接続に失敗しました。時間をおいて再度お試しください。"
    }, { status: 500 });
  }
}
