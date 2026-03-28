"use client";

import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, MessageCircle, Home } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCounseling } from '@/contexts/CounselingContext';
import { Button, Card } from '@/components/ui/common';

export default function CompletePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { customer, resetData } = useCounseling();

  const handleNewSession = () => {
    resetData();
    router.push('/staff/customers');
  };

  const handleBackToHome = () => {
    resetData();
    router.push('/staff');
  };

  // レポートURL
  const reportUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/counseling/${sessionId}`;

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 max-w-lg mx-auto pt-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            カウンセリング完了
          </h1>
          <p className="text-text-secondary">
            {customer?.name || 'お客様'}様のレポートが作成されました
          </p>
        </div>

        {/* Share Options */}
        <div className="space-y-4 mb-8">
          <Card className="text-center">
            <h3 className="font-bold text-text-primary mb-4">レポートを共有</h3>
            
            {/* QR Code */}
            <div className="bg-white rounded-xl p-6 mb-4 flex flex-col items-center justify-center">
              <QRCodeSVG
                value={reportUrl}
                size={180}
                level="M"
                marginSize={2}
              />
              <p className="text-sm text-text-secondary mt-3">
                QRコードをお客様に見せてください
              </p>
            </div>

            {/* LINE Send Button */}
            <Button 
              variant="secondary"
              fullWidth
              leftIcon={<MessageCircle className="w-5 h-5" />}
              className="bg-[#06C755] hover:bg-[#05B34D]"
            >
              LINEで送信
            </Button>
          </Card>

          {/* Report URL */}
          <Card>
            <h4 className="font-bold text-text-secondary text-sm mb-2">レポートURL</h4>
            <div className="bg-background rounded-lg p-3 text-sm text-text-secondary break-all">
              {reportUrl}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(reportUrl)}
              className="mt-2 text-primary text-sm font-medium"
            >
              URLをコピー
            </button>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="primary"
            fullWidth
            onClick={handleNewSession}
          >
            次のお客様へ
          </Button>
          <Button 
            variant="ghost"
            fullWidth
            onClick={handleBackToHome}
            leftIcon={<Home className="w-4 h-4" />}
          >
            ホームに戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
