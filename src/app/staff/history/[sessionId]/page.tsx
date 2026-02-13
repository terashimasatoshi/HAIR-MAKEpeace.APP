"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, User, Calendar, Droplets, FlaskConical, FileText, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/common';

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          console.log('Session data:', data);
          setSession(data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  
  if (!session) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-text-secondary">セッションが見つかりません</p>
    </div>
  );

  // 薬剤名を日本語に変換
  const getProductName = (productId: string) => {
    const products: Record<string, string> = {
      'neo-meteo-10.5': 'ネオメテオ 10.5',
      'neo-meteo-7.0': 'ネオメテオ 7.0',
      'neo-meteo-4.5': 'ネオメテオ 4.5',
      'meteo-gl': 'メテオGL',
      'incline': 'インクライン',
    };
    return products[productId] || productId;
  };

  // 処方データを表示用に整形
  const prescription = session.treatmentPlan;
  const assessment = session.hairCondition;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-text-secondary">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">カウンセリング履歴</h1>
        <div className="w-10" />
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* 基本情報 */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-text-primary">{session.customer?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>{new Date(session.date).toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric' })}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-text-secondary">担当: {session.staff?.name || '不明'}</p>
        </Card>

        {/* 使用薬剤 */}
        {prescription && (Object.keys(prescription).length > 0) && (
          <Card>
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              使用薬剤
            </h3>
            
            <div className="space-y-4">
              {/* 根元 */}
              {prescription.roots && (
                <div className="bg-background rounded-lg p-4">
                  <h4 className="font-bold text-sm text-text-secondary mb-2">根元</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-text-secondary text-xs">薬剤</p>
                      <p className="font-bold text-text-primary">{getProductName(prescription.roots.product)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs">量</p>
                      <p className="font-bold text-text-primary">{prescription.roots.amount}g</p>
                    </div>
                    {prescription.roots.incline > 0 && (
                      <div>
                        <p className="text-text-secondary text-xs">インクライン</p>
                        <p className="font-bold text-text-primary">{prescription.roots.incline}g</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 中間 */}
              {prescription.middle && (
                <div className="bg-background rounded-lg p-4">
                  <h4 className="font-bold text-sm text-text-secondary mb-2">中間</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-text-secondary text-xs">薬剤</p>
                      <p className="font-bold text-text-primary">{getProductName(prescription.middle.product)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs">量</p>
                      <p className="font-bold text-text-primary">{prescription.middle.amount}g</p>
                    </div>
                    {prescription.middle.incline > 0 && (
                      <div>
                        <p className="text-text-secondary text-xs">インクライン</p>
                        <p className="font-bold text-text-primary">{prescription.middle.incline}g</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 毛先 */}
              {prescription.ends && (
                <div className="bg-background rounded-lg p-4">
                  <h4 className="font-bold text-sm text-text-secondary mb-2">毛先</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-text-secondary text-xs">薬剤</p>
                      <p className="font-bold text-text-primary">{getProductName(prescription.ends.product)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs">量</p>
                      <p className="font-bold text-text-primary">{prescription.ends.amount}g</p>
                    </div>
                    {prescription.ends.incline > 0 && (
                      <div>
                        <p className="text-text-secondary text-xs">インクライン</p>
                        <p className="font-bold text-text-primary">{prescription.ends.incline}g</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 放置時間など追加情報 */}
              {(prescription.processingTime || prescription.heatTime) && (
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {prescription.processingTime && (
                      <div>
                        <p className="text-text-secondary text-xs">放置時間</p>
                        <p className="font-bold text-primary">{prescription.processingTime}分</p>
                      </div>
                    )}
                    {prescription.heatTime && (
                      <div>
                        <p className="text-text-secondary text-xs">加温時間</p>
                        <p className="font-bold text-primary">{prescription.heatTime}分</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* スタッフ所見 */}
        {assessment && (
          <Card>
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              スタッフ所見
            </h3>
            
            <div className="space-y-4">
              {/* お悩み */}
              {assessment.concerns && assessment.concerns.length > 0 && (
                <div>
                  <p className="text-xs text-text-secondary mb-2">お客様のお悩み</p>
                  <p className="text-text-primary bg-background rounded-lg p-3">
                    {assessment.concerns}
                  </p>
                </div>
              )}

              {/* スタッフ所見 */}
              {assessment.assessment && (
                <div>
                  <p className="text-xs text-text-secondary mb-2">所見・メモ</p>
                  <p className="text-text-primary bg-background rounded-lg p-3 whitespace-pre-wrap">
                    {assessment.assessment}
                  </p>
                </div>
              )}

              {/* ダメージレベルなど */}
              {(assessment.damageLevel || assessment.curlLevel) && (
                <div className="grid grid-cols-2 gap-4">
                  {assessment.damageLevel && (
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">ダメージレベル</p>
                      <p className="font-bold text-text-primary">Lv.{assessment.damageLevel}</p>
                    </div>
                  )}
                  {assessment.curlLevel && (
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">クセレベル</p>
                      <p className="font-bold text-text-primary">Lv.{assessment.curlLevel}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 部位別の状態 */}
              {(assessment.roots || assessment.middle || assessment.ends) && (
                <div>
                  <p className="text-xs text-text-secondary mb-2">部位別の状態</p>
                  <div className="space-y-2">
                    {assessment.roots && (
                      <div className="bg-background rounded-lg p-3">
                        <span className="font-bold text-sm">根元: </span>
                        <span className="text-text-secondary">
                          ダメージLv.{assessment.roots.damage} / クセLv.{assessment.roots.curl}
                        </span>
                      </div>
                    )}
                    {assessment.middle && (
                      <div className="bg-background rounded-lg p-3">
                        <span className="font-bold text-sm">中間: </span>
                        <span className="text-text-secondary">
                          ダメージLv.{assessment.middle.damage} / クセLv.{assessment.middle.curl}
                        </span>
                      </div>
                    )}
                    {assessment.ends && (
                      <div className="bg-background rounded-lg p-3">
                        <span className="font-bold text-sm">毛先: </span>
                        <span className="text-text-secondary">
                          ダメージLv.{assessment.ends.damage} / クセLv.{assessment.ends.curl}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* データがない場合 */}
        {(!prescription || Object.keys(prescription).length === 0) && (!assessment || Object.keys(assessment).length === 0) && (
          <Card>
            <div className="text-center py-8 text-text-secondary">
              <p>このセッションには詳細データがありません</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
