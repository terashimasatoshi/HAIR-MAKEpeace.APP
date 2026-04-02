import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { verifyApiSecret, checkRateLimit } from '@/lib/api-guard';

interface GenerateReviewRequest {
  hitokoto: string;
  storeName: string;
  menuNames: string[];
  concerns: string[];
  stylistName?: string;
}

export async function POST(request: Request) {
  const authError = await verifyApiSecret(request);
  if (authError) return authError;
  const rateLimitError = checkRateLimit(request);
  if (rateLimitError) return rateLimitError;
  try {
    const body: GenerateReviewRequest = await request.json();

    if (!body.hitokoto || body.hitokoto.length === 0) {
      return NextResponse.json({ error: '感想を入力してください' }, { status: 400 });
    }

    if (body.hitokoto.length > 100) {
      return NextResponse.json({ error: '100文字以内で入力してください' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        review: `${body.hitokoto}\n\nとても良い施術でした。また来たいです。`,
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const prompt = `あなたは美容室のお客様です。今日の施術体験をもとにGoogle口コミを書いてください。

【お客様の一言感想】
${body.hitokoto}

【店舗名】
${body.storeName}

【今日の施術内容】
${Array.isArray(body.menuNames) && body.menuNames.length > 0 ? body.menuNames.join('、') : '髪質改善トリートメント'}

【担当スタイリスト】
${body.stylistName || '指定なし'}

【来店前の悩み】
${Array.isArray(body.concerns) && body.concerns.length > 0 ? body.concerns.join('、') : '特になし'}

以下のルールで口コミを生成してください：
- お客様本人が書いたような自然な文体（丁寧語でもカジュアルでもOK）
- 一言感想のトーンやテンションに合わせる
- 150〜250文字程度
- 施術内容や悩みの解決に自然に触れる
- 担当スタイリスト名が指定されている場合は、自然な形で名前に触れる（例：「○○さんに担当していただきました」等）。「指定なし」の場合は名前に触れない
- 嘘や誇張は入れない
- 「また来たい」「おすすめ」など前向きな締めくくり
- 絵文字は1〜2個まで（なくてもOK）
- ★の数は入れない

口コミ文のみを出力してください。前置きや説明は不要です。`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('レスポンスが取得できませんでした');
    }

    return NextResponse.json({ review: textContent.text.trim() });
  } catch (error) {
    console.error('Generate review error:', error);
    return NextResponse.json(
      { error: '口コミ文の生成に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
