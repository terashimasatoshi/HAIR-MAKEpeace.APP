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
