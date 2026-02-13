"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/common';

// 薬剤の選択肢
const PRODUCT_OPTIONS = [
  { value: 'neo-meteo-10.5', label: 'ネオメテオクリーム10.5', ph: 'アルカリ' },
  { value: 'neo-meteo-7.0', label: 'ネオメテオクリーム7.0', ph: '中性' },
  { value: 'neo-meteo-4.5', label: 'ネオメテオクリーム4.5', ph: '酸性' },
  { value: 'meteo-gl', label: 'メテオトリートメントGL', ph: '酸性' },
];

// 部位ごとの薬剤選定データ
export interface SectionPrescription {
  product: string;
  amount: number;
  incline: number;
  ritpinoH: number;
}

// スタッフの処方データ全体
export interface StaffPrescription {
  powerLevel: number;
  root: SectionPrescription;
  middle: SectionPrescription;
  ends: SectionPrescription;
  ironTemperature: number;
  notes: string;
}

// デフォルト値
export const defaultPrescription: StaffPrescription = {
  powerLevel: 5,
  root: { product: 'neo-meteo-10.5', amount: 60, incline: 6, ritpinoH: 0 },
  middle: { product: 'neo-meteo-7.0', amount: 60, incline: 3, ritpinoH: 0 },
  ends: { product: 'neo-meteo-4.5', amount: 60, incline: 0, ritpinoH: 0 },
  ironTemperature: 180,
  notes: '',
};

interface StaffPrescriptionFormProps {
  prescription: StaffPrescription;
  onChange: (prescription: StaffPrescription) => void;
  onSubmitReview: () => void;
  isReviewing?: boolean;
}

export function StaffPrescriptionForm({ 
  prescription, 
  onChange, 
  onSubmitReview,
  isReviewing = false 
}: StaffPrescriptionFormProps) {
  
  const updateSection = (section: 'root' | 'middle' | 'ends', field: keyof SectionPrescription, value: string | number) => {
    onChange({
      ...prescription,
      [section]: {
        ...prescription[section],
        [field]: value,
      },
    });
  };

  const getPowerLevelColor = (level: number) => {
    if (level <= 2) return 'text-red-500';
    if (level <= 4) return 'text-orange-500';
    if (level <= 6) return 'text-yellow-600';
    if (level <= 8) return 'text-green-500';
    return 'text-emerald-600';
  };

  const getPowerLevelLabel = (level: number) => {
    if (level <= 2) return 'ハイダメージ';
    if (level <= 4) return 'ダメージ';
    if (level <= 6) return '普通';
    if (level <= 8) return '健康';
    return '非常に健康';
  };

  return (
    <div className="space-y-6">
      {/* 体力レベル判定 */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">体力レベル判定</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="10"
            value={prescription.powerLevel}
            onChange={(e) => onChange({ ...prescription, powerLevel: Number(e.target.value) })}
            className="flex-1 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full appearance-none cursor-pointer"
          />
          <div className="text-center min-w-[80px]">
            <span className={cn("text-3xl font-bold", getPowerLevelColor(prescription.powerLevel))}>
              {prescription.powerLevel}
            </span>
            <p className={cn("text-sm font-medium", getPowerLevelColor(prescription.powerLevel))}>
              {getPowerLevelLabel(prescription.powerLevel)}
            </p>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          0=ハイダメージ（体力なし）〜 10=バージン毛（体力あり）
        </p>
      </Card>

      {/* 部位別薬剤選定 */}
      {(['root', 'middle', 'ends'] as const).map((section) => (
        <Card key={section}>
          <h3 className="text-lg font-bold text-text-primary mb-4">
            {section === 'root' ? '根元' : section === 'middle' ? '中間' : '毛先'}の薬剤選定
          </h3>
          
          {/* ベース薬剤 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-text-secondary mb-2">ベース薬剤</label>
            <select
              value={prescription[section].product}
              onChange={(e) => updateSection(section, 'product', e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-surface text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {PRODUCT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.ph})
                </option>
              ))}
            </select>
          </div>

          {/* 配合量 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">薬剤量 (g)</label>
              <input
                type="number"
                value={prescription[section].amount}
                onChange={(e) => updateSection(section, 'amount', Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-border bg-surface text-center font-bold focus:border-primary outline-none"
                min="0"
                max="200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">インクライン (g)</label>
              <input
                type="number"
                value={prescription[section].incline}
                onChange={(e) => updateSection(section, 'incline', Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-border bg-surface text-center font-bold focus:border-primary outline-none"
                min="0"
                max="30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">リトピーノH (g)</label>
              <input
                type="number"
                value={prescription[section].ritpinoH}
                onChange={(e) => updateSection(section, 'ritpinoH', Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-border bg-surface text-center font-bold focus:border-primary outline-none"
                min="0"
                max="30"
              />
            </div>
          </div>
        </Card>
      ))}

      {/* アイロン温度 */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">アイロン温度</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="140"
            max="230"
            step="10"
            value={prescription.ironTemperature}
            onChange={(e) => onChange({ ...prescription, ironTemperature: Number(e.target.value) })}
            className="flex-1 h-3 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 rounded-full appearance-none cursor-pointer"
          />
          <div className="text-center min-w-[80px]">
            <span className="text-3xl font-bold text-orange-500">{prescription.ironTemperature}</span>
            <span className="text-lg text-text-secondary">℃</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-2">
          <span>140℃（低温）</span>
          <span>180℃（標準）</span>
          <span>230℃（高温）</span>
        </div>
      </Card>

      {/* 備考 */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">スタッフメモ</h3>
        <textarea
          value={prescription.notes}
          onChange={(e) => onChange({ ...prescription, notes: e.target.value })}
          placeholder="気になる点や特記事項があれば入力..."
          className="w-full p-3 rounded-lg border border-border bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] text-base resize-none"
        />
      </Card>

      {/* AIレビューボタン */}
      <button
        onClick={onSubmitReview}
        disabled={isReviewing}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-lg transition-all",
          isReviewing
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
        )}
      >
        {isReviewing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">🔄</span>
            AIがレビュー中...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            🤖 AIにレビューしてもらう
          </span>
        )}
      </button>
    </div>
  );
}

// AIレビュー結果の型
export interface AIReviewResult {
  overall: 'ok' | 'good' | 'caution' | 'warning';
  sections?: {
    root?: { status: 'ok' | 'caution' | 'warning'; message: string };
    middle?: { status: 'ok' | 'caution' | 'warning'; message: string };
    ends?: { status: 'ok' | 'caution' | 'warning'; message: string };
  };
  suggestions?: string[];
  precautions?: string[];
  warnings?: string[];
}

// AIレビュー結果表示コンポーネント
interface AIReviewResultProps {
  review: AIReviewResult;
  onAccept: () => void;
  onModify: () => void;
}

export function AIReviewResultCard({ review, onAccept, onModify }: AIReviewResultProps) {
  const statusIcon = {
    ok: '✅',
    caution: '⚠️',
    warning: '❌',
  };

  const statusColor = {
    ok: 'text-green-600 bg-green-50 border-green-200',
    caution: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    warning: 'text-red-600 bg-red-50 border-red-200',
  };

  const overallMessage: Record<string, string> = {
    ok: '処方内容は適切です',
    good: '処方内容は適切です',
    caution: '一部調整を検討してください',
    warning: '処方の見直しを推奨します',
  };

  // overall の値を正規化（'good' を 'ok' に変換）
  const normalizedOverall = review.overall === 'good' ? 'ok' : review.overall;

  // suggestions と precautions/warnings を安全に取得
  const suggestions = review.suggestions || [];
  const precautions = review.precautions || review.warnings || [];

  // sections を安全に取得
  const sections = review.sections || {};

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="text-lg font-bold text-text-primary">AIレビュー結果</h3>
      </div>

      {/* 全体評価 */}
      <div className={cn(
        "p-3 rounded-lg border mb-4",
        normalizedOverall === 'ok' ? 'bg-green-50 border-green-200' :
        normalizedOverall === 'caution' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      )}>
        <p className={cn(
          "font-bold text-center",
          normalizedOverall === 'ok' ? 'text-green-700' :
          normalizedOverall === 'caution' ? 'text-yellow-700' :
          'text-red-700'
        )}>
          {normalizedOverall === 'ok' ? '✅' : normalizedOverall === 'caution' ? '⚠️' : '❌'} {overallMessage[review.overall] || '処方を確認してください'}
        </p>
      </div>

      {/* 部位別評価 */}
      {Object.keys(sections).length > 0 && (
        <div className="space-y-3 mb-4">
          {(['root', 'middle', 'ends'] as const).map((section) => {
            const sectionData = sections[section];
            if (!sectionData) return null;
            return (
              <div 
                key={section} 
                className={cn("p-3 rounded-lg border", statusColor[sectionData.status] || statusColor.ok)}
              >
                <div className="flex items-start gap-2">
                  <span>{statusIcon[sectionData.status] || '✅'}</span>
                  <div>
                    <span className="font-bold">
                      {section === 'root' ? '根元' : section === 'middle' ? '中間' : '毛先'}:
                    </span>
                    <span className="ml-2">{sectionData.message}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 提案 */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-text-primary mb-2">💡 提案</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-text-secondary pl-4 relative before:content-['•'] before:absolute before:left-0">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 注意点 */}
      {precautions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-text-primary mb-2">⚡ 施術時の注意点</h4>
          <ul className="space-y-1">
            {precautions.map((precaution, i) => (
              <li key={i} className="text-sm text-orange-700 pl-4 relative before:content-['•'] before:absolute before:left-0">
                {precaution}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onModify}
          className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-text-secondary font-bold hover:bg-gray-50 transition-colors"
        >
          処方を修正する
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
        >
          この処方で確定
        </button>
      </div>
    </Card>
  );
}
