import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

interface GenerateImageRequest {
  styleTitle: string;
  styleDesc: string;
  colorName: string;
  colorCode: string;
  faceShape: string;
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
  return `あなたはプロの美容師向けヘアスタイルリファレンス写真を生成するAIです。

以下の条件に合致するヘアスタイルの写真を1枚生成してください。

【顔型】${data.faceShape}
【ヘアカラー】${data.colorName}（${data.colorCode}）
【スタイル名】${data.styleTitle}
【スタイルの特徴】${data.styleDesc}
【スタイリングの詳細】${data.aiAnalysis}

写真の条件：
- 日本人女性のヘアスタイル写真
- 美容室のスタイルブック（ヘアカタログ）に掲載されるようなプロフェッショナルな写真
- やや斜め前からのアングル（顔周りのシルエットがわかるように）
- 明るく自然なライティング
- 白〜薄いグレーの背景
- 顔はぼかすか横顔にし、髪型に注目させる
- 髪のツヤ感・質感がリアルに伝わるように
- 指定のヘアカラーが正確に反映されていること`;
}
