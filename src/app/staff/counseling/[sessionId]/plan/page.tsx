"use client";

import { useRouter, useParams } from 'next/navigation';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useCounseling } from '@/context/CounselingContext';
import { Header } from '@/components/counseling/CounselingComponents';
import { Button, Card, Section } from '@/components/ui/common';

export default function PlanPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { formData } = useCounseling();
  const plan = formData.aiPlan;

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">プランが生成されていません</p>
          <Button onClick={() => router.push(`/staff/counseling/${sessionId}`)}>
            カウンセリングに戻る
          </Button>
        </div>
      </div>
    );
  }

  const sectionLabels: Record<string, string> = {
    root: '根元',
    middle: '中間',
    ends: '毛先',
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header 
        title="AIプラン確認" 
        onBack={() => router.push(`/staff/counseling/${sessionId}`)} 
      />

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Recommendation Card */}
        <div className="bg-gradient-to-br from-accent-light/30 to-white border border-accent/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-sm font-bold text-accent mb-1 uppercase tracking-wider">Recommended Menu</h2>
          <h1 className="text-2xl font-bold text-primary-dark mb-4">{plan.recommendedMenu}</h1>
          <div className="flex items-center gap-6 text-text-secondary">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-text-primary">¥{plan.recommendedPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{plan.durationMinutes}分</span>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <Section title="薬剤選定">
          <div className="space-y-3">
            {(Object.entries(plan.productSelection) as [string, { product: string; ph: string; reason: string }][]).map(([key, data]) => (
              <Card key={key} className="border-l-4 border-l-primary">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-text-primary">{sectionLabels[key]}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-text-secondary">pH {data.ph}</span>
                </div>
                <p className="text-lg font-bold text-primary">{data.product}</p>
                <p className="text-sm text-text-secondary mt-1">{data.reason}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Process */}
        <Section title="施術プロセス">
          <div className="space-y-4">
            {plan.treatmentProcess.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                  {idx !== plan.treatmentProcess.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-text-primary">{step.action}</h4>
                    <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-1 rounded border border-border">
                      {step.timeMinutes}分
                    </span>
                  </div>
                  {step.temperature && (
                    <p className="text-sm text-accent font-medium mt-1">温度: {step.temperature}</p>
                  )}
                  <p className="text-sm text-text-secondary mt-1">{step.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Expected Results */}
        <Section title="期待される効果">
          <Card>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">ツヤ感</span>
                <span className="font-medium">{plan.expectedResults.shine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">質感</span>
                <span className="font-medium">{plan.expectedResults.texture}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">持続期間</span>
                <span className="font-medium">{plan.expectedResults.duration}</span>
              </div>
            </div>
          </Card>
        </Section>

        {/* Risks */}
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-warning font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>注意点・リスク</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
            {plan.risksAndPrecautions.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>

        {/* Home Care */}
        <Card title="ホームケアアドバイス">
          <p className="text-text-secondary">{plan.homeCareAdvice}</p>
        </Card>

        {/* Next Visit */}
        <Card title="次回来店推奨">
          <p className="text-text-secondary">{plan.nextVisitRecommendation}</p>
        </Card>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border flex gap-3 z-50 pb-safe">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={() => router.push(`/staff/counseling/${sessionId}`)}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          再生成
        </Button>
        <Button 
          variant="primary" 
          className="flex-[2] shadow-lg"
          onClick={() => router.push(`/staff/counseling/${sessionId}/after`)}
        >
          施術を開始する
        </Button>
      </div>
    </div>
  );
}
