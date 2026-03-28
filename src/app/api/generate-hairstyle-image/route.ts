import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { verifyApiSecret, checkRateLimit } from '@/lib/api-guard';

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
  gender?: string;
  customerName?: string;
  date?: string;
  stylistName?: string;
  concerns?: string[];
  damageLevel?: number;
  faceShape: string;
  personalColor: string;
  styles: StyleItem[];
  colors: ColorItem[];
  advice: string[];
  aiAnalysis: string;
}

export async function POST(request: Request) {
  const authError = verifyApiSecret(request);
  if (authError) return authError;
  const rateLimitError = checkRateLimit(request);
  if (rateLimitError) return rateLimitError;
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
  } catch (error) {
    console.error('Generate hairstyle image error:', error);
    return NextResponse.json(
      { error: '画像生成に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}

function buildPrompt(data: GenerateImageRequest): string {
  const stylesText = data.styles
    .slice(0, 2)
    .map((s, i) => `${i + 1}. ${s.title}`)
    .join('\n');

  const colorsText = data.colors
    .slice(0, 3)
    .map((c) => `・${c.name}（${c.code}）`)
    .join('\n');

  const isMale = data.gender === 'male';
  const genderLabel = isMale ? '男性' : '女性';
  const personDesc = isMale ? '日本人男性' : '日本人女性';
  const decoDesc = isMale
    ? 'シンプルで洗練されたライン・幾何学模様など控えめなデコレーション'
    : '花・星・キラキラなど華やかなデコレーション要素を散りばめる';
  const swatchShape = isMale ? '丸型' : 'ハート型';

  const customerName = data.customerName || 'お客様';
  const dateText = data.date || '';
  const stylistText = data.stylistName || '';

  return `あなたは美容室「HAIR & MAKE peace」のカウンセリングカード用イラストを描くプロのイラストレーターです。
以下の情報をもとに、${genderLabel}のお客様への総合カウンセリングカードを1枚の縦長イラストにまとめてください。

━━━━━ 診断結果 ━━━━━
【お名前】${customerName} 様
【顔型】${data.faceShape}
【パーソナルカラー】${data.personalColor}

【おすすめスタイル】
${stylesText}

【おすすめカラー】
${colorsText}

━━━━━ デザイン指示 ━━━━━

## 画像仕様
- 縦長（9:16のアスペクト比、スマートフォン全画面表示向け）
- 解像度は高めに

## テキストのルール
- テキストは最小限に抑え、大きく読みやすいフォントサイズで描く
- 細かい説明文は入れない。タイトル・名前・ラベル程度にとどめる
- 日本語テキストが文字化けする可能性があるため、読めなくても問題ないデザインにする
- テキストよりもイラスト・ビジュアルを重視する

## レイアウト（上から下へ）

### ① ヘッダー帯（最上部 10%）
- 「HAIR & MAKE peace」ロゴ風テキスト
- 「Counseling Card」サブタイトル
- 日付「${dateText}」と担当「${stylistText}」を小さく

### ② お客様プロフィール帯（10%）
- 「${customerName} 様」をエレガントに表示
- 診断バッジ風に：顔型「${data.faceShape}」・パーソナルカラー「${data.personalColor}」

### ③ スタイル提案エリア（メイン・最も大きく 55%）
- 中央に1つ目のスタイル「${data.styles[0]?.title}」を大きくメインイラストで描く
- 髪のツヤ感・質感・カラーがしっかり伝わるように
- 顔は正面〜やや斜めで描き、髪型のシルエットが分かるようにする
- 顔型「${data.faceShape}」に合わせた顔の形

### ④ カラーパレットエリア（15%）
- おすすめカラーを${swatchShape}のカラースウォッチで横並び表示
- 各色にカラー名ラベル付き

### ⑤ フッター帯（最下部 10%）
- 「HAIR & MAKE peace」
- 「Thank you for visiting!」

## イラストの条件
- ${personDesc}のヘアスタイルイラスト（水彩画風・温かみのあるタッチ）
- 背景はクリーム色〜ベージュ系の紙のようなテクスチャ
- ${decoDesc}
- 各セクションは枠線や背景色で区切り、視認性を確保
- 美容室のカウンセリングカードとしてプロフェッショナルかつ親しみやすいデザイン`;
}
