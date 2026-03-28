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
  const isMale = data.gender === 'male';
  const personDesc = isMale ? 'Japanese man' : 'Japanese woman';

  // メインスタイル名（英語表記 — 文字化け防止）
  const mainStyleTitle = data.styles[0]?.title || 'Recommended Style';

  // カラーコード（hex値はAIが正確に描ける）
  const colorSwatches = data.colors
    .slice(0, 3)
    .map((c) => `${c.code} (${c.name})`)
    .join(', ');

  return `You are a professional illustrator for a hair salon called "HAIR & MAKE peace".
Create a single vertical (9:16 aspect ratio) counseling card illustration.

IMPORTANT RULES FOR TEXT:
- Use ONLY English for ALL text in the image. NO Japanese text at all.
- All text must be LARGE and clearly readable (minimum 24pt equivalent)
- Maximum 20 words total in the entire image
- If text would be smaller than a title size, DO NOT include it

== CONTENT ==
Customer: ${data.customerName || 'Customer'}
Face shape: ${data.faceShape}
Personal color: ${data.personalColor}
Main style: ${mainStyleTitle}
Colors: ${colorSwatches}

== LAYOUT (top to bottom) ==

1. HEADER (top 10%)
   - "HAIR & MAKE peace" in elegant serif font, LARGE
   - "Counseling Card" subtitle

2. MAIN ILLUSTRATION (center 60% - this is the hero)
   - A beautiful ${personDesc} with the recommended hairstyle "${mainStyleTitle}"
   - Watercolor / soft illustration style
   - The hair color should reflect: ${data.colors[0]?.name || 'natural'}
   - Show the hairstyle clearly: front or 3/4 angle view
   - Hair should look glossy, healthy, with visible texture and movement
   - Face shape matches: ${data.faceShape}

3. COLOR PALETTE (15%)
   - 3 color circles showing recommended colors: ${colorSwatches}
   - Each circle is large (at least 40px equivalent) with the color name below in English

4. FOOTER (bottom 10%)
   - "HAIR & MAKE peace"
   - "Thank you!"

== STYLE ==
- Warm, inviting watercolor illustration style
- Background: cream/beige paper-like texture
- ${isMale ? 'Clean, minimal decorative elements' : 'Soft floral/sparkle decorations scattered around'}
- Professional yet approachable salon card design
- Color scheme: warm greens (#4A7C59) and golds (#C5A572) as accent colors
- Each section separated by subtle dividers or background tones`;
}
