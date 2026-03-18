import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Calendar, User, Sparkles } from 'lucide-react';
import { getReviewUrl, getStoreKeyFromId } from '@/lib/google-review';
import { GoogleReviewBanner } from '@/components/GoogleReviewBanner';

export const dynamic = 'force-dynamic';

// 共有ページ用に直接Supabaseクライアントを作成（cookieなし）
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qzwbyphqaspxrcgajkts.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export default async function ShareCounselingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: session, error } = await supabase
    .from('counseling_sessions')
    .select(`
      id,
      session_date,
      status,
      store_id,
      staff_assessment,
      staff_prescription,
      customer:customer_id (id, name),
      stylist:stylist_id (id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !session) {
    notFound();
  }

  // Supabaseのリレーション結合はオブジェクトまたは配列を返す場合がある
  const rawCustomer = session.customer as unknown;
  const customer = Array.isArray(rawCustomer) ? rawCustomer[0] as { id: string; name: string } | undefined : rawCustomer as { id: string; name: string } | null;
  const rawStylist = session.stylist as unknown;
  const stylist = Array.isArray(rawStylist) ? rawStylist[0] as { id: string; name: string } | undefined : rawStylist as { id: string; name: string } | null;
  const assessment = session.staff_assessment as Record<string, any> | null;
  const prescription = session.staff_prescription as Record<string, any> | null;
  const date = session.session_date
    ? new Date(session.session_date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // 店舗からレビューURLを取得
  const storeKey = getStoreKeyFromId(session.store_id);
  const reviewUrl = getReviewUrl(storeKey);

  // 薬剤名変換
  const getProductName = (productId: string) => {
    const products: Record<string, string> = {
      'neo-meteo-10.5': 'ネオメテオ 10.5',
      'neo-meteo-7.0': 'ネオメテオ 7.0',
      'neo-meteo-4.5': 'ネオメテオ 4.5',
      'meteo-gl': 'メテオGL',
      incline: 'インクライン',
    };
    return products[productId] || productId;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-[#4A7C59] to-[#5a9469] text-white px-4 py-6 text-center">
        <p className="text-xs tracking-widest opacity-80 mb-1">HAIR & MAKE</p>
        <h1 className="text-xl font-bold tracking-wider">peace</h1>
        <p className="text-xs opacity-80 mt-1">カウンセリングレポート</p>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4 pb-8">
        {/* 基本情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#333]">
                {customer?.name || 'お客様'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
            </div>
          </div>
          {stylist && (
            <p className="text-sm text-[#6B7280]">担当: {stylist.name}</p>
          )}
        </div>

        {/* スタッフ所見 */}
        {assessment && Object.keys(assessment).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
            <h3 className="font-bold text-[#333] mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4A7C59]" />
              本日の診断
            </h3>

            <div className="space-y-3">
              {assessment.concerns && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">お悩み</p>
                  <p className="text-[#333] bg-[#FDFBF7] rounded-lg p-3 text-sm">
                    {assessment.concerns}
                  </p>
                </div>
              )}

              {assessment.assessment && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">スタイリスト所見</p>
                  <p className="text-[#333] bg-[#FDFBF7] rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {assessment.assessment}
                  </p>
                </div>
              )}

              {(assessment.damageLevel || assessment.curlLevel) && (
                <div className="grid grid-cols-2 gap-3">
                  {assessment.damageLevel && (
                    <div className="bg-[#FDFBF7] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] mb-1">ダメージレベル</p>
                      <p className="font-bold text-[#333]">
                        Lv.{assessment.damageLevel}
                      </p>
                    </div>
                  )}
                  {assessment.curlLevel && (
                    <div className="bg-[#FDFBF7] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] mb-1">クセレベル</p>
                      <p className="font-bold text-[#333]">
                        Lv.{assessment.curlLevel}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 使用薬剤 */}
        {prescription && Object.keys(prescription).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
            <h3 className="font-bold text-[#333] mb-3">施術内容</h3>

            <div className="space-y-3">
              {['roots', 'middle', 'ends'].map((section) => {
                const data = prescription[section];
                if (!data) return null;
                const label =
                  section === 'roots'
                    ? '根元'
                    : section === 'middle'
                      ? '中間'
                      : '毛先';
                return (
                  <div key={section} className="bg-[#FDFBF7] rounded-lg p-3">
                    <h4 className="font-bold text-sm text-[#6B7280] mb-1">
                      {label}
                    </h4>
                    <p className="font-bold text-[#333]">
                      {getProductName(data.product)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* データがない場合 */}
        {(!assessment || Object.keys(assessment).length === 0) &&
          (!prescription || Object.keys(prescription).length === 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
              <div className="text-center py-8 text-[#6B7280]">
                <p>カウンセリングデータを準備中です</p>
              </div>
            </div>
          )}

        {/* Google口コミ誘導バナー */}
        {reviewUrl && <GoogleReviewBanner reviewUrl={reviewUrl} />}
      </main>

      {/* フッター */}
      <footer className="text-center py-6 text-xs text-[#999]">
        <p>HAIR & MAKE peace</p>
      </footer>
    </div>
  );
}
