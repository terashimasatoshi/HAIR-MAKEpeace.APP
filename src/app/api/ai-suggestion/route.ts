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

    // ── デザインスペース：長さ×希望に基づくOK/NGリスト ──
    const LENGTH_ORDER = ['ベリーショート', 'ショート', 'ボブ', 'ミディアム', 'ロング'];
    const currentIdx = LENGTH_ORDER.indexOf(hairLengthLabel);

    const STYLE_EXAMPLES: Record<string, string[]> = {
      'ベリーショート': ['ベリーショートレイヤー', 'フェードカット', 'ソフトモヒカン', 'マッシュベリーショート', 'ピクシーカット', 'バズカット'],
      'ショート': ['ショートレイヤー', 'ハンサムショート', 'マッシュショート', 'ショートボブ', 'ショートウルフ', '耳かけショート'],
      'ボブ': ['ボブ', 'ミニボブ', '切りっぱなしボブ', 'レイヤーボブ', '前下がりボブ', 'ワンレンボブ', '外ハネボブ'],
      'ミディアム': ['ミディアムレイヤー', 'くびれミディ', 'ロブ', '外ハネミディ', 'ウルフミディ', 'ミディアムパーマ'],
      'ロング': ['ロングレイヤー', 'ストレートロング', 'ロングウェーブ', 'ヨシンモリ', '姫カット', 'ワンレングスロング', 'ロングウルフ', '巻き髪ロング'],
    };

    let allowedLengths: string[] = [];
    let forbiddenLengths: string[] = [];
    let emotionalContext = '';
    let designConstraint = '';

    if (lengthPrefLabel === '伸ばしたい') {
      allowedLengths = LENGTH_ORDER.slice(Math.max(0, currentIdx));
      forbiddenLengths = LENGTH_ORDER.slice(0, currentIdx);
      emotionalContext = `このお客様は今の${hairLengthLabel}をさらに伸ばしたいと考えています。何ヶ月も我慢して伸ばしてきた髪を切る提案は、お客様の努力を否定することになります。`;
      designConstraint = `${hairLengthLabel}以上の長さのスタイルのみ提案してください。${forbiddenLengths.length > 0 ? forbiddenLengths.join('・') + 'は絶対にNGです。' : ''}`;
    } else if (lengthPrefLabel === '現状維持') {
      allowedLengths = [hairLengthLabel];
      forbiddenLengths = LENGTH_ORDER.filter(l => l !== hairLengthLabel);
      emotionalContext = `このお客様は今の${hairLengthLabel}の長さが気に入っています。長さを変えずに、カラーやレイヤー、質感の変化でリフレッシュしたいと思っています。`;
      designConstraint = `${hairLengthLabel}の長さを維持するスタイルのみ提案してください。長さが変わるスタイル名（${forbiddenLengths.join('・')}）はNGです。`;
    } else if (lengthPrefLabel === '少し短くしたい') {
      const shorter = currentIdx > 0 ? [LENGTH_ORDER[currentIdx - 1], hairLengthLabel] : [hairLengthLabel];
      allowedLengths = shorter;
      forbiddenLengths = LENGTH_ORDER.filter(l => !shorter.includes(l));
      emotionalContext = `このお客様は少しだけ短くして整えたいと考えています。大幅なイメチェンではなく、毛先の整理や1段階短い程度のスタイルを希望しています。`;
      designConstraint = `${shorter.join('〜')}の範囲のスタイルを提案してください。`;
    } else if (lengthPrefLabel === '短くしたい') {
      allowedLengths = LENGTH_ORDER.slice(0, currentIdx + 1);
      forbiddenLengths = LENGTH_ORDER.slice(currentIdx + 1);
      emotionalContext = `このお客様は思い切って短くしたいと考えています。変化を楽しみたい気持ちを大切に、現在の${hairLengthLabel}より短いスタイルを積極的に提案してください。`;
      designConstraint = `${hairLengthLabel}以下の長さのスタイルを中心に提案してください。`;
    } else {
      allowedLengths = LENGTH_ORDER;
      emotionalContext = `特に長さの希望はありません。現在の${hairLengthLabel}を基準に、バランスの良い提案をしてください。`;
      designConstraint = `${hairLengthLabel}前後の長さを中心に提案してください。`;
    }

    const allowedStyleExamples = allowedLengths
      .map(l => STYLE_EXAMPLES[l] || [])
      .flat()
      .join('、');
    const forbiddenStyleExamples = forbiddenLengths
      .map(l => STYLE_EXAMPLES[l] || [])
      .flat()
      .join('、');

    const isMale = gender === 'male';
    const categoryInstruction = isMale
      ? '王道 (classic), トレンド (trend), クール (cool), ナチュラル (natural), 楽ちん (easy maintenance)'
      : '王道 (classic), トレンド (trend), 個性派 (unique), イメチェン (transformation), 楽ちん (easy maintenance)';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `あなたは美容室「HAIR & MAKE peace」のプロの美容師です。
お客様の情報をもとに、似合う髪色とスタイルを提案してください。

━━━━━━━━━━━━━━━━━━━━
★ 最重要：お客様の髪の長さと希望
━━━━━━━━━━━━━━━━━━━━

現在の長さ：【${hairLengthLabel}】
お客様の希望：【${lengthPrefLabel}】

${emotionalContext}

■ デザインスペース（この範囲内でのみ提案すること）
${designConstraint}

✅ 提案OK なスタイル例：${allowedStyleExamples || 'すべて'}
${forbiddenStyleExamples ? `❌ 絶対NG なスタイル例：${forbiddenStyleExamples}` : ''}

━━━━━━━━━━━━━━━━━━━━
お客様プロフィール
━━━━━━━━━━━━━━━━━━━━

- 性別：${genderLabel}
- 年齢：${ageLabel}
- 顔型：${faceShape}（面長/丸顔/ベース型/逆三角形/卵型に分類して分析）
- パーソナルカラー：${personalColor}（ベース：${personalColorBase || '不明'}）
- 髪の悩み：${concerns?.length > 0 ? concerns.join('、') : 'なし'}
- 今日の季節：${currentSeason}
- 本日のご要望：${customerRequest?.trim() ? customerRequest : 'なし'}

━━━━━━━━━━━━━━━━━━━━
似合わせナレッジ
━━━━━━━━━━━━━━━━━━━━

${MATCHING_KNOWLEDGE}

━━━━━━━━━━━━━━━━━━━━
提案ルール
━━━━━━━━━━━━━━━━━━━━

1. 本日のご要望がある場合は最優先で反映する
2. ${genderLabel}に適したスタイル・カラーを提案する
3. ${ageLabel}の年代に合ったスタイルを提案する
4. 顔型に基づき「アウトフォーム」「インフォーム」「バング」の調整を含める
5. カラー4色を提案（明るめ1、ナチュラル1、暗め1、トレンド1）
6. スタイル5つを提案。カテゴリ：${categoryInstruction}
   ★★★ 5つ全てが「デザインスペース」内の長さであること ★★★
7. スタイリングアドバイスを4〜5点
8. 季節（${currentSeason}）のトレンドを反映する

━━━━━━━━━━━━━━━━━━━━
出力形式（JSON）
━━━━━━━━━━━━━━━━━━━━

以下のJSON形式で出力してください。JSON以外のテキストは不要です。

{
  "lengthCheck": {
    "currentLength": "${hairLengthLabel}",
    "preference": "${lengthPrefLabel}",
    "allStylesRespectLength": true
  },
  "summary": {
    "faceShape": "顔型（日本語）",
    "personalColor": "パーソナルカラー（日本語）",
    "matchRate": 80〜100の整数
  },
  "colors": [
    { "name": "カラー名", "code": "#HexCode", "desc": "おすすめ理由", "tone": "明るめ|ナチュラル|暗め|トレンド" }
  ],
  "styles": [
    { "id": 1, "title": "スタイル名", "desc": "おすすめ理由とお客様への似合わせポイント", "category": "王道|トレンド|個性派|イメチェン|楽ちん" }
  ],
  "advice": [
    "アドバイス1",
    "アドバイス2",
    "アドバイス3",
    "アドバイス4"
  ],
  "aiAnalysis": "総合アドバイス（日本語）。必ず「アウトフォーム」「インフォーム」「バング」への具体的な言及を含めること。"
}
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
      // lengthCheckをログ出力して検証（クライアントには送らない）
      if (result.lengthCheck) {
        console.log('[AI Suggestion] Length check:', result.lengthCheck);
        delete result.lengthCheck;
      }
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
