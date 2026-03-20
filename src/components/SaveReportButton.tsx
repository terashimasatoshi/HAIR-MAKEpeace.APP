'use client';

import { useState, useCallback } from 'react';
import { Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas-pro';

interface SaveReportButtonProps {
  targetId: string;
  fileName?: string;
}

export function SaveReportButton({ targetId, fileName = 'counseling-report.png' }: SaveReportButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = useCallback(async () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    setIsSaving(true);
    try {
      // SVGアイコンをcanvasで描画可能にする前処理
      const svgs = target.querySelectorAll('svg');
      svgs.forEach((svg) => {
        svg.setAttribute('width', svg.getBoundingClientRect().width.toString());
        svg.setAttribute('height', svg.getBoundingClientRect().height.toString());
      });

      const canvas = await html2canvas(target, {
        backgroundColor: '#FDFBF7',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: true,
      });

      // モバイル対応: Blob経由でダウンロード
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('html2canvas error:', err);
      alert('保存に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'));
    } finally {
      setIsSaving(false);
    }
  }, [targetId, fileName]);

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="w-full flex items-center justify-center gap-2 bg-[#4A7C59] hover:bg-[#3d6b4b] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-colors"
    >
      {isSaving ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          保存中...
        </>
      ) : isSaved ? (
        <>
          <Check className="w-5 h-5" />
          保存しました！
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          レポートを画像で保存
        </>
      )}
    </button>
  );
}
