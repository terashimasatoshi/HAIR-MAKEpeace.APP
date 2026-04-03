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
  const authError = await verifyApiSecret(request);
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

// ── バリエーション定義 ──

const ART_STYLES = [
  { name: '透明水彩画', desc: '透明感のある水彩画タッチ。にじみやぼかしを活かした柔らかい表現' },
  { name: 'デジタルファッションイラスト', desc: 'ファッション誌のような洗練されたデジタルイラスト。シャープな線とグラデーション' },
  { name: 'パステルアート', desc: 'パステルカラーを基調とした優しいタッチ。ふんわりとした質感' },
  { name: '線画＋ポイントカラー', desc: '繊細な線画をベースに、髪色やポイントだけカラーで着色するスタイリッシュな表現' },
  { name: 'ボタニカルアート風', desc: '植物画のような繊細な描き込みと自然な色彩。上品で知的な印象' },
  { name: '韓国風イラスト', desc: '韓国のビューティーイラスト風。透明感のある肌、ツヤのある髪、トレンド感のある表現' },
];

const SEASON_THEMES: Record<string, { bg: string; accent: string; deco: string; mood: string }> = {
  spring: {
    bg: '桜色・コーラルピンク・ウォームベージュのグラデーション背景',
    accent: 'コーラル・ピーチ・ゴールドのアクセントカラー',
    deco: '桜の花びら・チューリップ・蝶々・春の光の粒子',
    mood: '明るく華やかで可愛らしい春の雰囲気',
  },
  summer: {
    bg: 'ラベンダー・ペールブルー・ミントのグラデーション背景',
    accent: 'シルバー・ローズピンク・パールブルーのアクセントカラー',
    deco: '紫陽花・雨粒・パール・ソフトな光',
    mood: 'エレガントで涼やかなサマーの雰囲気',
  },
  autumn: {
    bg: 'テラコッタ・マスタード・ディープグリーンのグラデーション背景',
    accent: 'ゴールド・ブロンズ・バーガンディのアクセントカラー',
    deco: '紅葉・木の実・ドライフラワー・温かい光',
    mood: 'シックで大人っぽいオータムの雰囲気',
  },
  winter: {
    bg: 'ネイビー・ワインレッド・アイシーホワイトのグラデーション背景',
    accent: 'シルバー・プラチナ・ルビーレッドのアクセントカラー',
    deco: '雪の結晶・星・クリスタル・キラキラした光',
    mood: 'モダンでクールなウィンターの雰囲気',
  },
};

const COMPOSITIONS = [
  { angle: '正面やや斜め（3/4ビュー）', layout: '中央に大きくメインスタイル、左右にサブスタイルを小さく' },
  { angle: '横顔シルエット', layout: '左側に横顔の大きなシルエット、右側にスタイル名とカラーパレットを縦配置' },
  { angle: '正面アップ', layout: '画面いっぱいに正面の顔と髪、下部にカラーパレットを重ねて配置' },
  { angle: '後ろ姿・バックスタイル', layout: '背中側から髪全体のシルエットを大きく描き、下にスタイル名とカラー' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectSeason(personalColor: string): string {
  const lower = (personalColor || '').toLowerCase();
  if (lower.includes('spring') || lower.includes('スプリング') || lower.includes('春')) return 'spring';
  if (lower.includes('summer') || lower.includes('サマー') || lower.includes('夏')) return 'summer';
  if (lower.includes('autumn') || lower.includes('オータム') || lower.includes('秋')) return 'autumn';
  if (lower.includes('winter') || lower.includes('ウィンター') || lower.includes('冬')) return 'winter';
  return pick(['spring', 'summer', 'autumn', 'winter']);
}

function buildPrompt(data: GenerateImageRequest): string {
  const stylesText = (data.styles || [])
    .slice(0, 3)
    .map((s, i) => `${i + 1}. ${s.title}`)
    .join('\n');

  const colorsText = (data.colors || [])
    .slice(0, 3)
    .map((c) => `・${c.name}（${c.code}）`)
    .join('\n');

  const isMale = data.gender === 'male';
  const genderLabel = isMale ? '男性' : '女性';
  const personDesc = isMale ? '日本人男性' : '日本人女性';
  const swatchShape = isMale ? '丸型' : 'ハート型';

  const customerName = data.customerName || 'お客様';
  const dateText = data.date || '';
  const stylistText = data.stylistName || '';

  // ランダム要素の選択
  const artStyle = pick(ART_STYLES);
  const season = detectSeason(data.personalColor);
  const theme = SEASON_THEMES[season];
  const composition = pick(COMPOSITIONS);
  const decoDesc = isMale
    ? `シンプルで洗練されたライン・幾何学模様（${theme.accent}を使用）`
    : `${theme.deco}を散りばめる`;

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

## 今回のアートスタイル: ${artStyle.name}
${artStyle.desc}

## テキストのルール
- テキストは最小限に抑え、大きく読みやすいフォントサイズで描く
- 細かい説明文は入れない。タイトル・名前・ラベル程度にとどめる
- 日本語テキストが文字化けする可能性があるため、読めなくても問題ないデザインにする
- テキストよりもイラスト・ビジュアルを重視する

## レイアウト

### ① ヘッダー帯（最上部・小さく）
- 「HAIR & MAKE peace」ロゴ風テキスト
- 「Counseling Card」サブタイトル
- 日付「${dateText}」と担当「${stylistText}」を小さく

### ② お客様プロフィール帯（小さく）
- 「${customerName} 様」をエレガントに表示
- 診断バッジ風に：顔型「${data.faceShape}」・パーソナルカラー「${data.personalColor}」

### ③ スタイル提案エリア（メイン・画像の大半を占める）
- 構図: ${composition.angle}
- レイアウト: ${composition.layout}
- 1つ目のスタイル「${data.styles[0]?.title}」をメインで大きく描く
- 2つ目「${data.styles[1]?.title || ''}」・3つ目「${data.styles[2]?.title || ''}」もサブで描く
- 髪のツヤ感・質感・カラーがしっかり伝わるように
- 顔型「${data.faceShape}」に合わせた顔の形

### ④ カラーパレットエリア（下部・コンパクトに）
- おすすめカラーを${swatchShape}のカラースウォッチで表示
- 各色にカラー名ラベル付き

### ⑤ フッター帯（最下部・小さく）
- 「HAIR & MAKE peace」
- 「Thank you for visiting!」

## 重要な禁止事項
- 数字やパーセント表記は絶対に画像内に描かないこと
- レイアウト配分の数値は画像内に表示しないこと

## イラストの条件
- ${personDesc}のヘアスタイルイラスト
- アートスタイル: ${artStyle.name}（${artStyle.desc}）
- 背景: ${theme.bg}
- アクセント: ${theme.accent}
- 全体の雰囲気: ${theme.mood}
- 装飾: ${decoDesc}
- 各セクションは背景色やアクセントで自然に区切る
- 美容室のカウンセリングカードとしてプロフェッショナルかつ個性的なデザイン`;
}
