"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Save } from 'lucide-react';
import { useCounseling } from '@/context/CounselingContext';
import { 
  Header, 
  CustomerInfoCard, 
  SectionTabs, 
  DamageLevelSlider, 
  CurlSelector, 
  PillSelector, 
  StaffAssessmentSection,
  YesNoToggle 
} from '@/components/counseling/CounselingComponents';
import { Button, Section, Card } from '@/components/ui/common';

export default function CounselingPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { currentCustomer, formData, updateSectionData, setFormData } = useCounseling();
  const [activeTab, setActiveTab] = useState<'root' | 'middle' | 'ends'>('root');
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 顧客が選択されていない場合
  if (!currentCustomer) {
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

  // 髪の状態をSupabaseに保存する関数
  const saveHairCondition = async () => {
    const payload = {
      timing: 'before',
      rootDamage: formData.hairConditionBefore.root.damage,
      middleDamage: formData.hairConditionBefore.middle.damage,
      endsDamage: formData.hairConditionBefore.ends.damage,
      rootCurl: formData.hairConditionBefore.root.curl,
      middleCurl: formData.hairConditionBefore.middle.curl,
      endsCurl: formData.hairConditionBefore.ends.curl,
      lastColor: formData.treatmentHistory.lastColor,
      bleachCount: formData.treatmentHistory.bleachCount,
      bleachLastDate: formData.treatmentHistory.bleachLastDate || null,
      hasStraightening: formData.treatmentHistory.hasStraitening,
      straighteningLastDate: formData.treatmentHistory.straighteningLastDate || null,
      shineLevel: 3,
      texture: 'smooth',
      manageability: 3,
    };

    console.log('Saving hair condition:', payload);

    const res = await fetch(`/api/sessions/${sessionId}/hair-condition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '髪の状態の保存に失敗しました');
    }

    return await res.json();
  };

  // スタッフ所見をSupabaseに保存する関数
  const saveStaffAssessment = async () => {
    const payload = {
      assessmentNotes: formData.staffAssessment.assessmentNotes || '',
      concerns: formData.staffAssessment.concerns || '',
      customerRequests: formData.staffAssessment.customerRequests || '',
    };

    console.log('Saving staff assessment:', payload);

    const res = await fetch(`/api/sessions/${sessionId}/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'スタッフ所見の保存に失敗しました');
    }

    return await res.json();
  };

  // 全データを保存する関数
  const saveAllData = async () => {
    await saveHairCondition();
    await saveStaffAssessment();
  };

  // 保存ボタン（途中保存用）
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveAllData();
      setSaveMessage('✓ 保存しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('❌ 保存に失敗しました');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // 次へ：薬剤選定ページへ遷移
  const handleNext = async () => {
    setIsNavigating(true);
    try {
      // まず全データを保存
      await saveAllData();
      
      // 薬剤選定ページへ遷移
      router.push(`/staff/counseling/${sessionId}/prescription`);
    } catch (e) {
      console.error('Save error:', e);
      alert("データの保存に失敗しました");
    } finally {
      setIsNavigating(false);
    }
  };

  const updateHistory = (field: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      treatmentHistory: { ...prev.treatmentHistory, [field]: val }
    }));
  };

  const updateAssessment = (field: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      staffAssessment: { ...prev.staffAssessment, [field]: val }
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header 
        title="カウンセリング" 
        onBack={() => router.push('/staff/customers')} 
      />
      
      <main className="p-4 max-w-2xl mx-auto space-y-8">
        <CustomerInfoCard customer={currentCustomer} />

        {/* 施術前の状態 */}
        <Section title="施術前の状態" description="部位ごとの状態を入力してください">
          <SectionTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
            <DamageLevelSlider 
              value={formData.hairConditionBefore[activeTab].damage} 
              onChange={(val) => updateSectionData(activeTab, 'damage', val)} 
            />
            <div className="h-px bg-border my-6" />
            <CurlSelector 
              value={formData.hairConditionBefore[activeTab].curl} 
              onChange={(val) => updateSectionData(activeTab, 'curl', val)} 
            />
          </div>
        </Section>

        {/* 直近の施術履歴 */}
        <Section title="直近の施術履歴">
          <Card className="space-y-4">
            <PillSelector 
              label="最後のカラー"
              value={formData.treatmentHistory.lastColor}
              onChange={(v) => updateHistory('lastColor', v)}
              options={[
                { value: 'none', label: 'なし' },
                { value: '1month', label: '1ヶ月以内' },
                { value: '3months', label: '3ヶ月以内' },
                { value: '6months', label: '半年以内' },
                { value: '1year_plus', label: '1年以上' },
              ]}
            />
            <PillSelector 
              label="ブリーチ履歴"
              value={formData.treatmentHistory.bleachCount}
              onChange={(v) => updateHistory('bleachCount', v)}
              options={[
                { value: 'none', label: 'なし' },
                { value: '1', label: '1回' },
                { value: '2-3', label: '2-3回' },
                { value: '4plus', label: '4回以上' },
              ]}
            />
            <YesNoToggle
              label="縮毛矯正履歴"
              value={formData.treatmentHistory.hasStraitening}
              onChange={(v) => updateHistory('hasStraitening', v)}
            />
          </Card>
        </Section>

        {/* スタッフ所見 */}
        <Section title="スタッフ所見">
          <StaffAssessmentSection 
            notes={formData.staffAssessment.assessmentNotes}
            concerns={formData.staffAssessment.concerns}
            requests={formData.staffAssessment.customerRequests}
            onChange={updateAssessment}
          />
        </Section>

        {/* 途中保存ボタン */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleSave} 
            isLoading={isSaving}
            variant="secondary"
            leftIcon={<Save className="w-4 h-4" />}
          >
            途中保存
          </Button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pb-8 pb-safe">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={handleNext} 
            isLoading={isNavigating} 
            fullWidth 
            className="h-14 shadow-xl text-lg"
            leftIcon={<ArrowRight className="w-5 h-5" />}
          >
            {isNavigating ? '保存中...' : '次へ：薬剤選定'}
          </Button>
        </div>
      </div>
    </div>
  );
}
