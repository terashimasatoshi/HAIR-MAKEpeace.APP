'use client';

import { Star } from 'lucide-react';

interface GoogleReviewBannerProps {
  reviewUrl: string;
}

export function GoogleReviewBanner({ reviewUrl }: GoogleReviewBannerProps) {
  return (
    <div className="bg-gradient-to-br from-[#f0ebe3] to-[#e8f0e8] rounded-2xl p-6 text-center">
      <p className="text-lg font-bold text-[#4A7C59] mb-3">
        本日はありがとうございました
      </p>
      <p className="text-sm text-[#555] leading-relaxed mb-1">
        施術はいかがでしたか？
      </p>
      <p className="text-sm text-[#555] leading-relaxed mb-1">
        よろしければ、Googleでご感想をお聞かせください。
      </p>
      <p className="text-sm text-[#555] leading-relaxed mb-5">
        お客様の声が、私たちの励みになります。
      </p>
      <button
        onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
        className="inline-flex items-center gap-2 bg-[#C5A572] hover:bg-[#b8955f] text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md"
      >
        <Star className="w-5 h-5 fill-current" />
        Googleで口コミを書く
      </button>
      <p className="text-xs text-[#999] mt-4">
        ※ Googleアカウントでログイン済みならすぐに投稿できます
      </p>
    </div>
  );
}
