import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { MATCHING_KNOWLEDGE } from '@/lib/knowledge';

export async function POST(request: Request) {
  try {
    const { faceShape, personalColor, personalColorBase, concerns, request: customerRequest } = await request.json();

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
- Face Shape: ${faceShape} (Map this to one of: 面長, 丸顔, ベース型, 逆三角形. If "egg" or others, suggest generally balanced styles)
- Personal Color: ${personalColor}
- Personal Color Base: ${personalColorBase || 'unknown'}
- Concerns: ${concerns?.join(',')}
- Today's Request: ${customerRequest?.trim() ? customerRequest : 'なし'}

# Instructions
0. If "Today's Request" is provided, prioritize it first and adjust all suggestions to match it.
1. Analyze the customer's face shape using the Matching Knowledge.
2. Suggest "Out Form", "In Form", and "Bang" adjustments based on the knowledge.
3. Recommend 3 specific hair colors and 3 styles.
4. Provide concrete styling advice.

Output must be a valid JSON object with the following structure:
{
  "summary": {
    "faceShape": "Customer's face shape (in Japanese)",
    "personalColor": "Customer's personal color (in Japanese)",
    "matchRate": 80-100 (integer)
  },
  "colors": [
    { "name": "Color Name", "code": "#HexCode", "desc": "Reason for recommendation" }
  ],
  "styles": [
    { "id": 1, "title": "Style Name", "desc": "Reason" }
  ],
  "advice": [
    "Advice point 1",
    "Advice point 2",
    "Advice point 3"
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

  } catch (error: any) {
    console.error("AI Suggestion Error:", error);
    // Return a graceful fallback if AI fails
    return NextResponse.json({
      summary: {
        faceShape: "診断エラー",
        personalColor: "不明",
        matchRate: 0
      },
      colors: [],
      styles: [],
      advice: ["申し訳ありません。AIサービスの接続に失敗しました。", "時間をおいて再度お試しください。"],
      aiAnalysis: `エラー詳細: ${error.message || "Unknown Error"}`
    }, { status: 200 }); // Return 200 with error info to prevent client crash
  }
}
