"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCounseling } from '@/contexts/CounselingContext';
import { fetchApi } from '@/lib/fetch-api';
import { Header } from '@/components/counseling/CounselingComponents';
import { Button, Card } from '@/components/ui/common';
import { 
  StaffPrescriptionForm, 
  AIReviewResultCard,
  defaultPrescription,
  type StaffPrescription,
  type AIReviewResult 
} from '@/components/counseling/StaffPrescriptionForm';

export default function PrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { customer, data: formData } = useCounseling();
  
  const [prescription, setPrescription] = useState<StaffPrescription>(defaultPrescription);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  // 顧客が選択されていない場合
  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">顧客が選択されていません</p>
          <Button onClick={() => router.push('/staff/customers')}>
            顧客を選択する
          </Button>
        </div>
      </div>
    );
  }

  // AIレビューを実行
  const handleSubmitReview = async () => {
    setIsReviewing(true);
    try {
      const res = await fetchApi(`/api/sessions/${sessionId}/review-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffPrescription: prescription }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'レビューに失敗しました');
      }

      const { review } = await res.json();
      console.log('AI Review result:', review);
      setReviewResult(review);
      setShowReview(true);
    } catch (e) {
      console.error('Review error:', e);
      alert('AIレビューに失敗しました');
    } finally {
      setIsReviewing(false);
    }
  };

  // 処方を確定して施術開始
  const handleAccept = () => {
    router.push(`/staff/counseling/${sessionId}/after`);
  };

  // 処方を修正（レビュー結果を閉じる）
  const handleModify = () => {
    setShowReview(false);
    setReviewResult(null);
  };

  // 髪の状態サマリー
  const hairCondition = formData.hairConditionBefore;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header 
        title="薬剤選定" 
        onBack={() => router.push(`/staff/counseling/${sessionId}`)} 
      />

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 顧客情報 */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
              👤
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{customer.name} 様</h2>
              <p className="text-sm text-text-secondary">
                前回来店: {(customer as unknown as Record<string, string>).lastVisitDate || '初来店'}
              </p>
            </div>
          </div>
        </Card>

        {/* 髪の状態サマリー */}
        <Card>
          <h3 className="text-sm font-bold text-text-secondary mb-3">📋 入力済みの髪の状態</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary mb-1">根元</p>
              <p className="text-lg font-bold text-text-primary">
                ダメージ {hairCondition.root.damage}
              </p>
              <p className="text-xs text-text-secondary">{hairCondition.root.curl}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">中間</p>
              <p className="text-lg font-bold text-text-primary">
                ダメージ {hairCondition.middle.damage}
              </p>
              <p className="text-xs text-text-secondary">{hairCondition.middle.curl}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">毛先</p>
              <p className="text-lg font-bold text-text-primary">
                ダメージ {hairCondition.ends.damage}
              </p>
              <p className="text-xs text-text-secondary">{hairCondition.ends.curl}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border text-sm text-text-secondary">
            <div className="flex flex-wrap gap-2">
              {formData.treatmentHistory.lastColor !== 'none' && (
                <span className="px-2 py-1 bg-surface rounded text-xs">
                  カラー: {formData.treatmentHistory.lastColor}
                </span>
              )}
              {formData.treatmentHistory.bleachCount !== 'none' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                  ブリーチ: {formData.treatmentHistory.bleachCount}回
                </span>
              )}
              {formData.treatmentHistory.hasStraitening && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  縮毛矯正あり
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* AIレビュー結果（表示時） */}
        {showReview && reviewResult && (
          <AIReviewResultCard 
            review={reviewResult}
            onAccept={handleAccept}
            onModify={handleModify}
          />
        )}

        {/* スタッフ処方フォーム（レビュー表示時は非表示） */}
        {!showReview && (
          <StaffPrescriptionForm
            prescription={prescription}
            onChange={setPrescription}
            onSubmitReview={handleSubmitReview}
            isReviewing={isReviewing}
          />
        )}
      </main>
    </div>
  );
}
