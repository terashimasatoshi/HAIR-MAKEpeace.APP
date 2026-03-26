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

  const isMale = data.gender === 'male';
  const genderLabel = isMale ? '男性' : '女性';
  const personDesc = isMale ? '日本人男性' : '日本人女性';
  const decoDesc = isMale
    ? 'シンプルで洗練されたライン・幾何学模様など控えめなデコレーション'
    : '花・星・キラキラなど華やかなデコレーション要素を散りばめる';
  const swatchShape = isMale ? '丸型' : 'ハート型';

  const concernsText = data.concerns?.length
    ? data.concerns.join('・')
    : 'なし';
  const damageLevelText = data.damageLevel
    ? `Lv.${data.damageLevel}/5`
    : '未診断';
  const customerName = data.customerName || 'お客様';
  const dateText = data.date || '';
  const stylistText = data.stylistName || '';

  return `あなたは美容室「HAIR & MAKE peace」のカウンセリングカード用イラストを描くプロのイラストレーターです。
以下の情報をもとに、${genderLabel}のお客様への総合カウンセリングカードを1枚の縦長イラストにまとめてください。

━━━━━ お客様情報 ━━━━━
【お名前】${customerName} 様
【日付】${dateText}
【担当】${stylistText}
【性別】${genderLabel}
【お悩み】${concernsText}
【ダメージレベル】${damageLevelText}

━━━━━ 診断結果 ━━━━━
【顔型】${data.faceShape}
【パーソナルカラー】${data.personalColor}

━━━━━ AI提案 ━━━━━
【おすすめスタイル】
${stylesText}

【おすすめカラー】
${colorsText}

【スタイリングのコツ】
${adviceText}

【AIからのアドバイス】
${data.aiAnalysis}

━━━━━ デザイン指示 ━━━━━

## 画像仕様
- 縦長（9:16のアスペクト比、スマートフォン全画面表示向け）
- 解像度は高めに

## レイアウト（上から下へ）

### ① ヘッダー帯（最上部）
- 「HAIR & MAKE peace」ロゴ風テキスト
- 「Counseling Report」サブタイトル
- 日付「${dateText}」と担当「${stylistText}」を小さく

### ② お客様プロフィール帯
- 「${customerName} 様」をエレガントに表示
- 診断バッジ風に：顔型「${data.faceShape}」・パーソナルカラー「${data.personalColor}」・ダメージ「${damageLevelText}」
- お悩みを小さなタグ風に：${concernsText}

### ③ スタイル提案エリア（メイン・最も大きく）
- 中央に1つ目のスタイル「${data.styles[0]?.title}」を大きくメインイラストで描く
- 左右に2つ目・3つ目のスタイルをやや小さめに描く
- 各スタイルにスタイル名ラベルと一言説明

### ④ カラーパレットエリア
- おすすめカラーを${swatchShape}のカラースウォッチで横並び表示
- 各色にカラー名ラベル付き

### ⑤ アドバイスエリア
- 「スタイリングのコツ」を箇条書きで
- 手書き風のメモスタイル

### ⑥ フッター帯（最下部）
- 「HAIR & MAKE peace」
- 「Thank you for visiting!」

## イラストの条件
- ${personDesc}のヘアスタイルイラスト（水彩画風・温かみのあるタッチ）
- 背景はクリーム色〜ベージュ系の紙のようなテクスチャ
- ${decoDesc}
- 各セクションは枠線や背景色で区切り、視認性を確保
- 美容室のカウンセリングカードとしてプロフェッショナルかつ親しみやすいデザイン
- 髪のツヤ感・質感・カラーがしっかり伝わるように
- 顔は正面〜やや斜めで描き、髪型のシルエットが分かるようにする
- テキストは日本語で、読みやすいフォントサイズで描く`;
}
