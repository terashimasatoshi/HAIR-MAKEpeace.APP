"use client";

import React from 'react';
import { ChevronLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/common';
import { DamageLevel, CurlIntensity, Customer } from '@/lib/types';

// --- Header ---
interface HeaderProps {
  title: string;
  onBack: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function Header({ title, onBack, onSave, isSaving }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-text-secondary touch-target">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-bold text-text-primary">{title}</h1>
      <div className="w-10 flex justify-end">
        {onSave && (
          <button onClick={onSave} disabled={isSaving} className="text-primary font-medium text-sm">
            {isSaving ? '保存中...' : '保存'}
          </button>
        )}
      </div>
    </header>
  );
}

// --- Customer Info ---
interface CustomerInfoCardProps {
  customer: {
    name: string;
    lastVisitDate?: string;
    visitCount: number;
  };
  onViewHistory?: () => void;
}

export function CustomerInfoCard({ customer, onViewHistory }: CustomerInfoCardProps) {
  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{customer.name} 様</h2>
            <p className="text-sm text-text-secondary">
              前回来店: {customer.lastVisitDate || '初来店'} • {customer.visitCount}回目
            </p>
          </div>
        </div>
        {customer.visitCount > 1 && onViewHistory && (
          <button 
            onClick={onViewHistory}
            className="text-primary text-sm font-medium underline underline-offset-2"
          >
            前回の施術
          </button>
        )}
      </div>
    </Card>
  );
}

// --- Section Tabs ---
interface SectionTabsProps {
  activeTab: 'root' | 'middle' | 'ends';
  onTabChange: (tab: 'root' | 'middle' | 'ends') => void;
  completedTabs?: ('root' | 'middle' | 'ends')[];
}

export function SectionTabs({ activeTab, onTabChange, completedTabs = [] }: SectionTabsProps) {
  const tabs = [
    { id: 'root', label: '根元', sub: 'Root' },
    { id: 'middle', label: '中間', sub: 'Middle' },
    { id: 'ends', label: '毛先', sub: 'Ends' },
  ] as const;

  return (
    <div className="flex gap-1 mb-6 bg-surface p-1 rounded-xl border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 h-12 rounded-lg flex flex-col items-center justify-center transition-all touch-target relative",
            activeTab === tab.id
              ? 'bg-primary text-white shadow-md'
              : 'bg-transparent text-text-secondary hover:bg-black/5'
          )}
        >
          <span className="text-sm font-bold leading-none">{tab.label}</span>
          <span className={cn(
            "text-[10px] leading-none mt-1",
            activeTab === tab.id ? 'text-white/80' : 'text-text-secondary/60'
          )}>
            {tab.sub}
          </span>
          {completedTabs.includes(tab.id) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// --- Damage Slider ---
interface DamageLevelSliderProps {
  value: DamageLevel;
  onChange: (value: DamageLevel) => void;
}

const damageColors: Record<DamageLevel, string> = {
  1: 'bg-damage-1',
  2: 'bg-damage-2',
  3: 'bg-damage-3',
  4: 'bg-damage-4',
  5: 'bg-damage-5',
};

export function DamageLevelSlider({ value, onChange }: DamageLevelSliderProps) {
  const levels: { val: DamageLevel; label: string; color: string }[] = [
    { val: 1, label: '健康', color: 'bg-damage-1' },
    { val: 2, label: 'やや健康', color: 'bg-damage-2' },
    { val: 3, label: '普通', color: 'bg-damage-3' },
    { val: 4, label: 'ダメージ', color: 'bg-damage-4' },
    { val: 5, label: 'ハイダメージ', color: 'bg-damage-5' },
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-4">
        <label className="text-base font-bold text-text-primary">ダメージレベル</label>
        <span className={cn("text-2xl font-bold px-3 py-1 rounded-lg text-white", damageColors[value])}>
          {value}
        </span>
      </div>
      
      <div className="relative h-12 flex items-center justify-between px-2">
        {/* Track */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-damage-1 via-damage-3 to-damage-5 opacity-30 pointer-events-none" />
        
        {levels.map((level) => (
          <button
            key={level.val}
            onClick={() => onChange(level.val)}
            className="group relative z-10 flex flex-col items-center focus:outline-none touch-target"
            style={{ width: '44px' }}
          >
            <div 
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all duration-200",
                value === level.val 
                  ? `${level.color} border-white shadow-lg scale-125` 
                  : 'bg-white border-gray-300 group-hover:border-primary'
              )} 
            />
            <span className={cn(
              "absolute top-8 text-xs whitespace-nowrap font-medium transition-colors",
              value === level.val ? 'text-text-primary font-bold' : 'text-text-secondary/60'
            )}>
              {level.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Curl Selector ---
interface CurlSelectorProps {
  value: CurlIntensity;
  onChange: (value: CurlIntensity) => void;
}

export function CurlSelector({ value, onChange }: CurlSelectorProps) {
  const options: { id: CurlIntensity; label: string; icon: string }[] = [
    { id: 'straight', label: '直毛', icon: '│' },
    { id: 'light', label: '軽い', icon: ')' },
    { id: 'medium', label: '中程度', icon: 'S' },
    { id: 'strong', label: '強い', icon: '§' },
  ];

  return (
    <div className="mb-8">
      <label className="text-base font-bold text-text-primary mb-3 block">くせの強さ</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 h-14 rounded-lg flex flex-col items-center justify-center border transition-all touch-target",
              value === opt.id
                ? 'bg-primary border-primary text-white shadow-md'
                : 'bg-surface border-border text-text-secondary'
            )}
          >
            <span className="text-lg leading-none mb-1 font-serif">{opt.icon}</span>
            <span className="text-xs font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Pill Selector ---
interface PillSelectorProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}

export function PillSelector({ label, options, value, onChange }: PillSelectorProps) {
  return (
    <div className="mb-6">
      <label className="text-sm font-bold text-text-secondary mb-2 block">{label}</label>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border touch-target",
              value === opt.value
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface border-border text-text-secondary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Staff Assessment ---
interface StaffAssessmentProps {
  notes: string;
  concerns: string;
  requests: string;
  onChange: (field: string, value: string) => void;
}

export function StaffAssessmentSection({ notes, concerns, requests, onChange }: StaffAssessmentProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-text-secondary mb-2">状態の所見</label>
        <textarea
          value={notes}
          onChange={(e) => onChange('assessmentNotes', e.target.value)}
          placeholder="髪の状態について気づいたことを入力"
          className="w-full p-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] text-base resize-none bg-surface"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-text-secondary mb-2">注意点・懸念</label>
        <textarea
          value={concerns}
          onChange={(e) => onChange('concerns', e.target.value)}
          placeholder="施術時の注意点があれば入力"
          className="w-full p-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] text-base resize-none bg-surface"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-text-secondary mb-2">顧客の要望</label>
        <textarea
          value={requests}
          onChange={(e) => onChange('customerRequests', e.target.value)}
          placeholder="お客様の希望・悩みを入力"
          className="w-full p-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] text-base resize-none bg-surface"
        />
      </div>
    </div>
  );
}

// --- Yes/No Toggle ---
interface YesNoToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function YesNoToggle({ label, value, onChange }: YesNoToggleProps) {
  return (
    <div className="pt-2">
      <label className="text-sm font-bold text-text-secondary mb-2 block">{label}</label>
      <div className="flex gap-4">
        <button 
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 py-3 rounded-lg border font-bold touch-target transition-colors",
            !value 
              ? 'bg-primary text-white border-primary' 
              : 'bg-surface border-border text-text-secondary'
          )}
        >
          なし
        </button>
        <button 
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 py-3 rounded-lg border font-bold touch-target transition-colors",
            value 
              ? 'bg-primary text-white border-primary' 
              : 'bg-surface border-border text-text-secondary'
          )}
        >
          あり
        </button>
      </div>
    </div>
  );
}
