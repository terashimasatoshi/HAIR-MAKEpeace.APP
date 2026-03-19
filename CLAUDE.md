# HAIR-MAKEpeace.APP

peaceカウンセリングアプリ v2

## 技術スタック

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage)
- Claude API (AI提案)
- Vercel (ホスティング)
- MediaPipe Face Landmarker (顔型診断)

## 開発コマンド

```
npm run dev      # 開発サーバー
npm run build    # プロダクションビルド
npm run lint     # ESLint
```

## Supabaseテーブル構成

- counseling_sessions: カウンセリング記録
- counseling_session_concerns: 悩み選択データ
- customers: 顧客情報
- stylists: スタイリスト情報
- visits: 来店記録
- treatment_records: 施術記録
- treatment_photos: 写真（Supabase Storage連携）

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=（Supabase URL）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabase匿名キー）
ANTHROPIC_API_KEY=（Claude APIキー）
NEXT_PUBLIC_PLACE_ID_TAKAYANAGI=ChIJowmpIdK_-F8R-j-9ojepUWE
NEXT_PUBLIC_PLACE_ID_HANADO=ChIJLYYyuau-F8R5EbKN6zsn9A
```

## アプリフロー

1. 顧客選択/新規登録
2. カウンセリング入力（悩み・ダメージレベル・顔型・パーソナルカラー）
3. 本日のメニュー選択
4. AI提案（似合う色・顔周りスタイル）
5. 顧客と画面共有
6. 施術記録入力
7. 仕上がり写真登録
8. 完了 → QRコードで共有ページへ

## 顔型診断機能

- MediaPipe Face Landmarkerを使用
- 4パターン分類（卵型・丸型・面長・ベース型）
- FaceDiagnosisModalコンポーネントで実装済み

---

## Google口コミ誘導機能

### 概要
共有ページ（/share/counseling/[id]）の下部に、Googleビジネスプロフィールの口コミ投稿ボタンを表示する。
施術完了後にQRで共有 → お客様がカウンセリング結果を確認 → ページ下部でGoogle口コミへ自然に誘導する。

### Place ID（環境変数で管理）

Vercelの環境変数に設定済み：

```
NEXT_PUBLIC_PLACE_ID_TAKAYANAGI=ChIJowmpIdK_-F8R-j-9ojepUWE
NEXT_PUBLIC_PLACE_ID_HANADO=ChIJLYYyuau-F8R5EbKN6zsn9A
```

レビュー投稿URL形式：
`https://search.google.com/local/writereview?placeid={PLACE_ID}`

### 店舗とPlace IDのマッピング

ヘルパー関数として作成：

```typescript
// lib/google-review.ts

type StoreKey = 'takayanagi' | 'hanado';

const PLACE_IDS: Record<StoreKey, string | undefined> = {
  takayanagi: process.env.NEXT_PUBLIC_PLACE_ID_TAKAYANAGI,
  hanado: process.env.NEXT_PUBLIC_PLACE_ID_HANADO,
};

export const getReviewUrl = (storeKey: StoreKey): string | null => {
  const placeId = PLACE_IDS[storeKey];
  if (!placeId) return null;
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
};
```

※ 店舗の判定は、カウンセリングデータに紐づくstylist情報またはvisitデータから行う。
  店舗情報がデータに含まれていない場合は、デフォルトで高柳店のPlace IDを使用する。

### コンポーネント仕様

#### GoogleReviewBanner

**ファイル**: `src/components/GoogleReviewBanner.tsx`

**Props**:
```typescript
interface GoogleReviewBannerProps {
  reviewUrl: string;
}
```

**表示位置**: 共有ページ（/share/counseling/[id]）の最下部。
カウンセリング内容・AI提案・仕上がり写真セクションの下に配置。

**表示内容**:
```
✨ 本日はありがとうございました

施術はいかがでしたか？
よろしければ、Googleでご感想をお聞かせください。
お客様の声が、私たちの励みになります。

[ ⭐ Googleで口コミを書く ]  ← ボタン（新しいタブで開く）

※ Googleアカウントでログイン済みならすぐに投稿できます
```

**デザイン**:
- 背景: 薄いグリーン系またはベージュ系（peaceのブランドカラーに合わせる）
- ボタン: ゴールド系または温かみのある色
- テキスト: 柔らかいトーン、押し付けがましくない

**ボタンの挙動**:
- `window.open(reviewUrl, '_blank', 'noopener,noreferrer')` で新しいタブでGoogleレビュー画面を開く

**表示条件**:
- reviewUrl が存在する場合のみ表示
- 共有ページでのみ使用（スタッフ側の画面には表示しない）

### 注意事項（Googleポリシー・法令遵守）
- 口コミの対価として割引・特典を明示しない（Googleポリシー違反）
- 「★5をお願いします」等の評価指定をしない
- Googleロゴ（Gマーク等）は使用しない（商標回避）
- 文面は中立的で「ご感想をお聞かせください」という表現に留める


# Google口コミ AI文章生成機能 - CLAUDE.md追記用テキスト

以下を CLAUDE.md の「Google口コミ誘導機能」セクションの末尾に追記してください。

---

### AI口コミ文章生成機能

#### 概要
お客様が一言感想を入力するだけで、AIが施術内容を踏まえた口コミ文章を生成する。
口コミ投稿のハードルを下げ、具体的で自然な口コミを増やすことが目的。

#### フロー
1. GoogleReviewBannerの中に、一言感想のテキスト入力欄を表示
2. お客様が一言入力（例：「ツヤツヤになった」「頭スッキリ」「カラーの色が綺麗」）
3. 「AIに文章を考えてもらう」ボタンをタップ
4. API Route経由でClaude APIを呼び出し、口コミ文を生成
5. 生成された文章をプレビュー表示
6. 「この文章をコピー」ボタンでクリップボードにコピー
7. 「Googleで口コミを投稿する」ボタンでGoogleレビュー画面へ遷移 → 貼り付けて投稿

#### API Route

**ファイル**: `src/app/api/generate-review/route.ts`

**メソッド**: POST

**リクエスト**:
```typescript
interface GenerateReviewRequest {
  hitokoto: string;          // お客様の一言感想
  storeName: string;         // 店舗名（例: "HAIR&MAKE peace"）
  menuNames: string[];       // 施術メニュー（例: ["METEOカラー", "カット"]）
  concerns: string[];        // お客様の悩み（例: ["パサつき", "くせ毛"]）
  customerName?: string;     // お客様名（イニシャル程度、省略可）
}
```

**レスポンス**:
```typescript
interface GenerateReviewResponse {
  review: string;  // 生成された口コミ文
}
```

**Claude APIプロンプト**:
```
あなたは美容室のお客様です。今日の施術体験をもとにGoogle口コミを書いてください。

【お客様の一言感想】
{hitokoto}

【店舗名】
{storeName}

【今日の施術内容】
{menuNames}

【来店前の悩み】
{concerns}

以下のルールで口コミを生成してください：
- お客様本人が書いたような自然な文体（丁寧語でもカジュアルでもOK）
- 一言感想のトーンやテンションに合わせる
- 150〜250文字程度
- 施術内容や悩みの解決に自然に触れる
- 嘘や誇張は入れない
- 「また来たい」「おすすめ」など前向きな締めくくり
- 絵文字は1〜2個まで（なくてもOK）
- ★の数は入れない
```

**Claude API設定**:
- モデル: claude-haiku（コスト効率重視）
- temperature: 0.8（自然なバリエーション）
- max_tokens: 500

#### コンポーネント変更

**GoogleReviewBanner を拡張**

既存のGoogleReviewBannerコンポーネントを拡張し、AI文章生成のUI要素を追加する。

**追加Props**:
```typescript
interface GoogleReviewBannerProps {
  reviewUrl: string;
  storeName: string;        // AI生成用
  menuNames: string[];      // AI生成用
  concerns: string[];       // AI生成用
}
```

**UI仕様（GoogleReviewBanner内に追加）**:
```
━━━━━━━━━━━━━━━━━━━━━━

✨ 本日はありがとうございました

施術はいかがでしたか？
よろしければ、Googleでご感想をお聞かせください。

┌─────────────────────────────────┐
│ 一言で感想を教えてください       │
│                                 │
│ [     ツヤツヤになった！     ]  │  ← テキスト入力（placeholder: 例）ツヤツヤになった！）
│                                 │
│ [ ✨ AIに口コミ文を考えてもらう ] │  ← ボタン
└─────────────────────────────────┘

↓ AI生成後に表示 ↓

┌─────────────────────────────────┐
│ 💬 AIが考えた口コミ文            │
│                                 │
│ 「髪のパサつきが気になっていて   │
│ 　METEOカラーをしていただきまし  │
│ 　た。仕上がりがツヤツヤで感動   │
│ 　です！スタッフさんの説明も     │
│ 　丁寧で安心できました。         │
│ 　また伺いたいです✨」           │
│                                 │
│ [ 📋 この文章をコピー ]          │  ← クリップボードにコピー
│                                 │
│ ※ この文章はAIが作成した参考文です│
│ 　自由に編集してご利用ください   │
└─────────────────────────────────┘

[ ⭐ Googleで口コミを投稿する ]    ← 既存のGoogleレビューボタン

━━━━━━━━━━━━━━━━━━━━━━
```

**状態管理**:
- hitokoto: string（入力テキスト）
- generatedReview: string | null（AI生成結果）
- isGenerating: boolean（ローディング状態）
- isCopied: boolean（コピー完了フィードバック）

**インタラクション**:
- 一言が空の場合、生成ボタンは非活性
- 生成中はボタンにスピナー表示、「考え中...」テキスト
- コピー成功後、ボタンテキストを一時的に「コピーしました！」に変更（2秒後に戻す）
- 生成された文章は編集不可（テキストエリアではなく表示のみ）
- 気に入らなければ一言を変えて再生成可能

**注意**: GoogleReviewBannerは現在サーバーコンポーネントの共有ページ内にあるため、
AI生成のインタラクティブ部分は 'use client' のクライアントコンポーネントとして分離する必要がある。
GoogleReviewBanner自体を 'use client' にするか、AI生成部分を別コンポーネント（ReviewAIGenerator等）に分けること。

#### セキュリティ・コスト考慮

- API RouteでClaude APIを呼ぶため、APIキーはサーバー側で安全に管理される
- 不正利用防止: 1セッションIDにつき生成は最大3回まで（クライアント側のカウントで十分）
- Haikuモデル使用でコストを抑える（1回あたり約0.1円未満）
- 入力テキストの最大文字数: 100文字

#### 注意事項
- AI生成であることをお客様に明示する（「AIが作成した参考文です」の表記必須）
- 「自由に編集してご利用ください」を必ず表示
- やらせ・捏造にならないよう、お客様の一言感想をベースにする
- 施術していないメニューや効果を捏造しない

- 完了画面のQRコード共有機能
概要
施術完了画面（/customers/[customerId]/complete または /staff/counseling/[sessionId]/complete）に
QRコードを表示し、お客様がスマホで読み取ると共有ページ（/share/counseling/[id]）で
カウンセリングレポートを閲覧できるようにする。
完了画面への追加UI
「次回予約を入れる」ボタンの下、「ホームに戻る」ボタンの上に、QRコード共有セクションを追加する。
表示内容:
━━━━━━━━━━━━━━━━━━━━━━

📱 カウンセリングレポートを共有

お客様のスマホで下のQRコードを
読み取ると、本日のレポートを
ご確認いただけます。

┌─────────────────────┐
│                     │
│     [QRコード]      │
│                     │
└─────────────────────┘

[ 📋 URLをコピー ]

━━━━━━━━━━━━━━━━━━━━━━
QRコード生成
ライブラリ: qrcode.react（react用QRコード生成ライブラリ）
bashnpm install qrcode.react
QRコードに埋め込むURL:
{window.location.origin}/share/counseling/{counseling_session_id}
例: https://hair-mak-epeace-app.vercel.app/share/counseling/abc123-def456
QRコード設定:

サイズ: 200x200px
背景: 白
前景: 黒
マージン: 2

コンポーネント
ファイル: src/components/QRCodeShare.tsx
typescript'use client';

interface QRCodeShareProps {
  sessionId: string;
}
機能:

QRコード表示（qrcode.react使用）
URLコピーボタン（navigator.clipboard.writeText）
コピー成功時「コピーしました！」フィードバック（2秒後に戻す）

完了画面の変更
完了画面のコンポーネント（completeページ）に QRCodeShare コンポーネントを追加。
sessionId（counseling_sessionのid）をpropsとして渡す。
セッションIDの取得方法：

URLパラメータまたはSupabaseから最新のcounseling_sessionを取得
visitsテーブルのcounseling_session_idカラム、
またはcounseling_sessionsテーブルからcustomer_idで最新レコードを取得

共有ページ（/share/counseling/[id]）
すでに作成済み。以下の情報を表示する：

顧客名
施術日
お悩み
ダメージレベル
顔型・パーソナルカラー
AI提案結果（おすすめカラー・スタイル）
施術メニュー
スタイリストからの次回アドバイス
最下部: Google口コミ誘導バナー（別セクションで定義済み）
