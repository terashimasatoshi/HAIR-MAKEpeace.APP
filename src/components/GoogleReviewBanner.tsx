'use client';

import { useState } from 'react';
import { Star, Sparkles, ClipboardCopy, Check, Loader2, MapPin } from 'lucide-react';

type StoreKey = 'takayanagi' | 'hanado';

interface GoogleReviewBannerProps {
  reviewUrlTakayanagi: string | null;
  reviewUrlHanado: string | null;
  defaultStore: StoreKey;
  menuNames: string[];
  concerns: string[];
  stylistName?: string;
  allStylists?: string[];
}

const STORE_LABELS: Record<StoreKey, string> = {
  takayanagi: '高柳店',
  hanado: '花堂店',
};

const STORE_FULL_NAMES: Record<StoreKey, string> = {
  takayanagi: 'HAIR&MAKE peace 高柳店',
  hanado: 'HAIR&MAKE peace 花堂店',
};

const MAX_GENERATE_COUNT = 3;

export function GoogleReviewBanner({ reviewUrlTakayanagi, reviewUrlHanado, defaultStore, menuNames, concerns, stylistName, allStylists }: GoogleReviewBannerProps) {
  const [selectedStore, setSelectedStore] = useState<StoreKey>(defaultStore);
  const [selectedStylist, setSelectedStylist] = useState(stylistName || '');
  const [hitokoto, setHitokoto] = useState('');
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);

  const reviewUrl = selectedStore === 'takayanagi' ? reviewUrlTakayanagi : reviewUrlHanado;

  const handleGenerate = async () => {
    if (!hitokoto.trim() || isGenerating || generateCount >= MAX_GENERATE_COUNT) return;

    setIsGenerating(true);
    try {
      // 共有ページは公開ページのためCSRFトークンなしの素のfetchを使用
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hitokoto, storeName: STORE_FULL_NAMES[selectedStore], menuNames, concerns, stylistName: selectedStylist }),
      });

      if (!res.ok) {
        let message = '生成に失敗しました';
        try {
          const err = await res.json();
          if (err.error) message = err.error;
        } catch {
          // non-JSON response (e.g. HTML error page)
        }
        throw new Error(message);
      }

      const data = await res.json();
      setGeneratedReview(data.review);
      setGenerateCount((c) => c + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReview) return;
    let copied = false;
    try {
      // 方法1: Clipboard API (HTTPS環境)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedReview);
        copied = true;
      }
    } catch {
      // Clipboard API失敗 — フォールバックへ
    }
    if (!copied) {
      try {
        // 方法2: execCommand fallback
        const textarea = document.createElement('textarea');
        textarea.value = generatedReview;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        // iOS Safari対策: setSelectionRangeを使う
        textarea.focus();
        textarea.setSelectionRange(0, textarea.value.length);
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // execCommandも失敗
      }
    }
    if (copied) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      // どちらも失敗した場合、テキストを選択状態にして手動コピーを促す
      const reviewEl = document.getElementById('generated-review-text');
      if (reviewEl) {
        const range = document.createRange();
        range.selectNodeContents(reviewEl);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      alert('自動コピーできませんでした。テキストを選択しましたので、長押しでコピーしてください。');
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#f0ebe3] to-[#e8f0e8] rounded-2xl p-6 text-center">
      <p className="text-lg font-bold text-[#4A7C59] mb-3">
        本日はありがとうございました
      </p>
      <p className="text-sm text-[#555] leading-relaxed mb-1">
        施術はいかがでしたか？
      </p>
      <p className="text-sm text-[#555] leading-relaxed mb-5">
        よろしければ、Googleでご感想をお聞かせください。
      </p>

      {/* 店舗選択 */}
      {reviewUrlTakayanagi && reviewUrlHanado && (
        <div className="mb-5">
          <p className="text-xs text-[#777] mb-2 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            ご来店の店舗を選択してください
          </p>
          <div className="flex gap-2 justify-center">
            {(['takayanagi', 'hanado'] as StoreKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedStore(key)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                  selectedStore === key
                    ? 'bg-[#4A7C59] text-white shadow-md'
                    : 'bg-white/70 text-[#555] border border-[#ccc] hover:bg-white'
                }`}
              >
                {STORE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI口コミ生成セクション */}
      <div className="bg-white/70 rounded-xl p-4 mb-5 text-left">
        {/* 担当スタイリスト選択 */}
        {allStylists && allStylists.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-bold text-[#333] mb-2">
              担当スタイリスト
            </p>
            <div className="flex flex-wrap gap-2">
              {allStylists.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedStylist(name)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    selectedStylist === name
                      ? 'bg-[#4A7C59] text-white shadow-md'
                      : 'bg-white text-[#555] border border-[#ccc] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm font-bold text-[#333] mb-2">
          一言で感想を教えてください
        </p>
        <input
          type="text"
          value={hitokoto}
          onChange={(e) => setHitokoto(e.target.value.slice(0, 100))}
          placeholder="例）ツヤツヤになった！"
          className="w-full px-4 py-3 rounded-lg border border-[#ddd] bg-white text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#4A7C59] focus:ring-1 focus:ring-[#4A7C59]"
        />
        <div className="flex justify-between items-center mt-1 mb-3">
          <span className="text-xs text-[#999]">{hitokoto.length}/100</span>
          {generateCount > 0 && (
            <span className="text-xs text-[#999]">
              残り{MAX_GENERATE_COUNT - generateCount}回生成できます
            </span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={!hitokoto.trim() || isGenerating || generateCount >= MAX_GENERATE_COUNT}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#4A7C59] hover:bg-[#3d6a4b] disabled:bg-[#aaa] disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-colors text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              考え中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AIに口コミ文を考えてもらう
            </>
          )}
        </button>
      </div>

      {/* AI生成結果 */}
      {generatedReview && (
        <div className="bg-white/80 rounded-xl p-4 mb-5 text-left">
          <p className="text-sm font-bold text-[#333] mb-2 flex items-center gap-1.5">
            <span>💬</span> AIが考えた口コミ文
          </p>
          <div id="generated-review-text" className="bg-[#FDFBF7] rounded-lg p-4 text-sm text-[#333] leading-relaxed whitespace-pre-wrap border border-[#e4e4e7] select-text">
            {generatedReview}
          </div>
          <button
            onClick={handleCopy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#f5f5f5] text-[#333] font-bold py-2.5 px-6 rounded-full transition-colors text-sm border border-[#ddd]"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-[#4A7C59]" />
                コピーしました！
              </>
            ) : (
              <>
                <ClipboardCopy className="w-4 h-4" />
                この文章をコピー
              </>
            )}
          </button>
          <p className="text-xs text-[#999] mt-2">
            ※ この文章はAIが作成した参考文です。自由に編集してご利用ください
          </p>
        </div>
      )}

      {/* Googleレビューボタン */}
      <button
        onClick={() => reviewUrl && window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
        disabled={!reviewUrl}
        className="inline-flex items-center gap-2 bg-[#C5A572] hover:bg-[#b8955f] disabled:bg-[#aaa] disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md"
      >
        <Star className="w-5 h-5 fill-current" />
        Googleで口コミを投稿する
      </button>
      <p className="text-xs text-[#999] mt-4">
        ※ Googleアカウントでログイン済みならすぐに投稿できます
      </p>
    </div>
  );
}
