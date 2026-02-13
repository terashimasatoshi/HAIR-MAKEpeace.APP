"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCounseling } from '@/context/CounselingContext';
import { Header } from '@/components/counseling/CounselingComponents';
import { Button, Section, Card } from '@/components/ui/common';
import { DamageLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

const damageColors: Record<DamageLevel, string> = {
  1: 'bg-damage-1',
  2: 'bg-damage-2',
  3: 'bg-damage-3',
  4: 'bg-damage-4',
  5: 'bg-damage-5',
};

export default function AfterPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { formData, setFormData } = useCounseling();
  
  const [afterDamage, setAfterDamage] = useState<{root: DamageLevel, middle: DamageLevel, ends: DamageLevel}>({
    root: 1, 
    middle: 1, 
    ends: 1
  });
  const [shine, setShine] = useState<DamageLevel>(5);
  const [staffComment, setStaffComment] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const sections = ['root', 'middle', 'ends'] as const;
  const labels: Record<typeof sections[number], string> = { root: '根元', middle: '中間', ends: '毛先' };

  // Before & After比較バー
  const ComparisonBar = ({ label, before, after }: { label: string; before: number; after: number }) => {
    const improvement = before - after;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>{label}</span>
          {improvement > 0 && (
            <span className="text-green-600">↓ {improvement}レベル改善</span>
          )}
        </div>
        <div className="h-4 bg-gray-200 rounded-full relative overflow-hidden">
          {/* Before Marker */}
          <div 
            className="absolute top-0 bottom-0 bg-gray-400 z-10"
            style={{ width: `${(before / 5) * 100}%` }}
          />
          {/* After Marker */}
          <div 
            className={cn(
              "absolute top-0 bottom-0 z-20 transition-all duration-1000 ease-out",
              damageColors[after as DamageLevel]
            )}
            style={{ width: `${(after / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-secondary mt-1">
          <span>Before: Lv.{before}</span>
          <span>After: Lv.{after}</span>
        </div>
      </div>
    );
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // フォームデータを更新
      setFormData(prev => ({
        ...prev,
        hairConditionAfter: {
          root: { damage: afterDamage.root },
          middle: { damage: afterDamage.middle },
          ends: { damage: afterDamage.ends },
          shineLevel: shine,
          texture: 'smooth',
          manageability: 3,
        },
        actualTreatment: {
          menuName: prev.aiPlan?.recommendedMenu || '',
          productsUsed: [],
          staffComments: staffComment,
        },
      }));

      // セッション完了APIを呼び出し（visit_countも更新される）
      const res = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'セッション完了に失敗しました');
      }

      const result = await res.json();
      console.log('Session completed, visit count:', result.visitCount);

      // 完了ページへ遷移
      router.push(`/staff/counseling/${sessionId}/complete`);
    } catch (error) {
      console.error('Complete error:', error);
      alert('完了処理に失敗しました');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header 
        title="施術後の状態" 
        onBack={() => router.push(`/staff/counseling/${sessionId}/prescription`)} 
      />

      <main className="p-4 max-w-2xl mx-auto space-y-8">
        {/* Before & After Comparison */}
        <Section title="Before & After 比較">
          <Card className="bg-surface">
            {sections.map(sec => (
              <ComparisonBar 
                key={sec} 
                label={labels[sec]} 
                before={formData.hairConditionBefore[sec].damage} 
                after={afterDamage[sec]} 
              />
            ))}
          </Card>
        </Section>

        {/* After Evaluation */}
        <Section title="仕上がり評価">
          <h3 className="font-bold text-text-secondary mb-4">部位別ダメージレベル</h3>
          <div className="space-y-6">
            {sections.map(sec => (
              <div key={sec} className="bg-surface p-4 rounded-xl border border-border">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">{labels[sec]}</span>
                  <span className={cn(
                    "font-bold px-2 py-0.5 rounded text-white text-sm",
                    damageColors[afterDamage[sec]]
                  )}>
                    Lv.{afterDamage[sec]}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" max="5" step="1"
                  value={afterDamage[sec]}
                  onChange={(e) => setAfterDamage({
                    ...afterDamage, 
                    [sec]: parseInt(e.target.value) as DamageLevel
                  })}
                  className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>健康</span>
                  <span>ハイダメージ</span>
                </div>
              </div>
            ))}
          </div>

          {/* Shine Level */}
          <div className="mt-8">
            <h3 className="font-bold text-text-secondary mb-4">ツヤ感</h3>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">✨</span>
                <span className="text-xl font-bold">{shine}/5</span>
              </div>
              <input 
                type="range" min="1" max="5" 
                value={shine} 
                onChange={(e) => setShine(parseInt(e.target.value) as DamageLevel)}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>少ない</span>
                <span>とても良い</span>
              </div>
            </Card>
          </div>
        </Section>
        
        {/* Staff Comment */}
        <Section title="スタッフコメント">
          <textarea 
            value={staffComment}
            onChange={(e) => setStaffComment(e.target.value)}
            className="w-full p-4 rounded-xl border border-border min-h-[120px] bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
            placeholder="お客様へのメッセージや次回の提案などを入力..." 
          />
        </Section>
      </main>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border z-50 pb-safe">
        <Button 
          variant="primary" 
          fullWidth 
          className="h-14 shadow-xl text-lg"
          onClick={handleComplete}
          isLoading={isCompleting}
        >
          {isCompleting ? '処理中...' : 'レポートを作成して完了'}
        </Button>
      </div>
    </div>
  );
}
