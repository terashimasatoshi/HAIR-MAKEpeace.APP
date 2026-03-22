import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

interface StyleItem {
  title: string;
  desc: string;
}

interface ColorItem {
  name: string;
  code: string;
  desc: string;
}

interface GenerateImageRequest {
  faceShape: string;
  personalColor: string;
  styles: StyleItem[];
  colors: ColorItem[];
  advice: string[];
  aiAnalysis: string;
}

export async function POST(request: Request) {
  try {
    const body: GenerateImageRequest = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(body);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-image-preview',
      generationConfig: {
        // @ts-expect-error -- responseModalities is supported for image generation
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts) {
      return NextResponse.json(
        { error: '画像の生成に失敗しました' },
        { status: 500 }
      );
    }

    // Extract image data from response parts
    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    return NextResponse.json(
      { error: '画像データが含まれていませんでした' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Generate hairstyle image error:', error);
    return NextResponse.json(
      { error: error.message || '画像生成に失敗しました' },
      { status: 500 }
    );
  }
}

function buildPrompt(data: GenerateImageRequest): string {
  const stylesText = data.styles
    .map((s, i) => `${i + 1}. ${s.title}：${s.desc}`)
    .join('\n');

  const colorsText = data.colors
    .map((c) => `・${c.name}（${c.code}）- ${c.desc}`)
    .join('\n');

  const adviceText = data.advice
    .map((a) => `・${a}`)
    .join('\n');

  return `あなたは美容室のカウンセリングシート用イラストを描くプロのイラストレーターです。
以下の情報をもとに、お客様に提案するヘアスタイルを1枚のイラストシートにまとめてください。

【顔型】${data.faceShape}
【パーソナルカラー】${data.personalColor}

【おすすめスタイル】
${stylesText}

【おすすめカラー】
${colorsText}

【スタイリングのコツ】
${adviceText}

【AIからのアドバイス】
${data.aiAnalysis}

以下のレイアウトと条件でイラストシートを1枚生成してください：

レイアウト：
- 上部にリボン風バナーで「${data.faceShape}×${data.personalColor} 似合うヘアスタイル」とタイトル
- 中央に1つ目のおすすめスタイル「${data.styles[0]?.title}」を大きくメインで描く
- メインの左右に2つ目・3つ目のスタイルを小さめに描き、それぞれスタイル名のラベルをつける
- 左下に「スタイリングのコツ」枠を設けて箇条書き
- 右下におすすめカラーをハート型のカラースウォッチで表示

イラストの条件：
- 日本人女性のヘアスタイルイラスト（水彩画風・温かみのあるタッチ）
- 背景はクリーム色〜ベージュ系の紙のようなテクスチャ
- 花・星・キラキラなどのデコレーション要素を散りばめる
- 各スタイル名はラベルで見やすく表示
- 美容室のカウンセリングシートとしてプロフェッショナルかつ親しみやすいデザイン
- 髪のツヤ感・質感・カラーがしっかり伝わるように
- 顔は正面〜やや斜めで描き、髪型のシルエットが分かるようにする`;
}
