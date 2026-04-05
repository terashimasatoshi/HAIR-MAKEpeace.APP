import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64, mediaType, measurements } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const anthropic = new Anthropic();

    const measurementsText = measurements
      ? `
【MediaPipeによる計測データ（参考値）】
- widthRatio（顔幅/顔長さ）: ${measurements.widthRatio?.toFixed(3)}
- jawRatio（顎幅/顔幅）: ${measurements.jawRatio?.toFixed(3)}
- chinAngle（顎の角度）: ${measurements.chinAngle?.toFixed(1)}°
- foreheadRatio（額幅/顔幅）: ${measurements.foreheadRatio?.toFixed(3)}
- cheekboneRatio（頬骨幅/顔幅）: ${measurements.cheekboneRatio?.toFixed(3)}
- verticalBalance（中顔面/下顔面比）: ${measurements.verticalBalance?.toFixed(3)}
`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `あなたは美容師向けの顔型診断AIです。この写真の人物の顔型を判定してください。

【分類】以下の4つから1つ選んでください：
- oval（卵型）: 額から顎にかけて緩やかなカーブ。縦横のバランスが良い。顎先がやや細い
- round（丸顔）: 横幅が広く頬がふっくら。顎のラインが丸い。縦横比がほぼ同じ
- long（面長）: 縦に長い。額・中顔面・下顔面が縦長。横幅が狭め
- base（ベース型）: エラが張っている。顎のラインが角張っている。顔の下半分に幅がある

${measurementsText}

【重要な注意】
- 写真の見た目の印象を最優先してください
- 計測データはあくまで参考です。数値と視覚的印象が異なる場合は、視覚的印象を優先してください
- 日本人の顔型を想定しています
- 髪型に惑わされず、顔の輪郭で判断してください

以下のJSON形式で回答してください。他の文章は不要です：
{"faceType": "oval|round|long|base", "confidence": 0-100, "reason": "判定理由を1-2文で"}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSONを抽出（前後のテキストがある場合も対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Face diagnosis: Failed to parse response:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      faceType: parsed.faceType,
      confidence: parsed.confidence,
      reason: parsed.reason,
    });
  } catch (err) {
    console.error('Face diagnosis API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
