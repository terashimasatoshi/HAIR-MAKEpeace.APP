import { notFound } from 'next/navigation';
import { Calendar, User, Sparkles } from 'lucide-react';
import { getReviewUrl } from '@/lib/google-review';
import { GoogleReviewBanner } from '@/components/GoogleReviewBanner';
import { SaveReportButton } from '@/components/SaveReportButton';
import { createServiceSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ShareCounselingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceSupabaseClient();

  const { data: session, error } = await supabase
    .from('counseling_sessions')
    .select(`
      id,
      created_at,
      gender,
      concerns,
      damage_level,
      face_shape,
      personal_color_base,
      personal_color_season,
      request,
      selected_menus,
      ai_suggestion,
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
  const aiSuggestion = session.ai_suggestion as Record<string, any> | null;
  const concerns = session.concerns as string[] | null;
  const date = session.created_at
    ? new Date(session.created_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // 両店舗のレビューURLを取得（DBに店舗カラムがないため手動選択、デフォルト高柳店）
  const reviewUrlTakayanagi = getReviewUrl('takayanagi');
  const reviewUrlHanado = getReviewUrl('hanado');

  const hasCardImage = aiSuggestion?.styleSheetImageUrl;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div id="report-content">

      {hasCardImage ? (
        <>
          {/* 総合カード画像がある場合：カード中心レイアウト */}
          <header className="bg-gradient-to-r from-[#4A7C59] to-[#5a9469] text-white px-4 py-4 text-center">
            <p className="text-[10px] tracking-widest opacity-80 mb-0.5">HAIR & MAKE</p>
            <h1 className="text-lg font-bold tracking-wider">peace</h1>
            <p className="text-xs opacity-70 mt-1">
              {customer?.name || 'お客様'} 様 ― {date}
              {stylist && ` ― 担当: ${stylist.name}`}
            </p>
          </header>

          {/* メインカード画像 */}
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-[#e4e4e7]/30">
              <img
                src={aiSuggestion.styleSheetImageUrl as string}
                alt="カウンセリングカード"
                className="w-full h-auto"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* カード画像がない場合：従来のテキストレイアウト */}
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

            {/* カウンセリング診断 */}
            {(concerns || session.damage_level || session.face_shape || session.personal_color_season) && (
              <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
                <h3 className="font-bold text-[#333] mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#4A7C59]" />
                  本日の診断
                </h3>

                <div className="space-y-3">
                  {concerns && concerns.length > 0 && (
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">お悩み</p>
                      <p className="text-[#333] bg-[#FDFBF7] rounded-lg p-3 text-sm">
                        {concerns.join('、')}
                      </p>
                    </div>
                  )}

                  {session.request && (
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">ご要望</p>
                      <p className="text-[#333] bg-[#FDFBF7] rounded-lg p-3 text-sm">
                        {session.request}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {session.damage_level && (
                      <div className="bg-[#FDFBF7] rounded-lg p-3">
                        <p className="text-xs text-[#6B7280] mb-1">ダメージレベル</p>
                        <p className="font-bold text-[#333]">
                          Lv.{session.damage_level}
                        </p>
                      </div>
                    )}
                    {session.face_shape && (
                      <div className="bg-[#FDFBF7] rounded-lg p-3">
                        <p className="text-xs text-[#6B7280] mb-1">顔型</p>
                        <p className="font-bold text-[#333]">
                          {session.face_shape === 'oval' ? '卵型' : session.face_shape === 'round' ? '丸型' : session.face_shape === 'long' ? '面長' : session.face_shape === 'base' ? 'ベース型' : session.face_shape}
                        </p>
                      </div>
                    )}
                    {session.personal_color_season && (
                      <div className="bg-[#FDFBF7] rounded-lg p-3">
                        <p className="text-xs text-[#6B7280] mb-1">パーソナルカラー</p>
                        <p className="font-bold text-[#333]">
                          {session.personal_color_season === 'spring' ? 'スプリング' : session.personal_color_season === 'summer' ? 'サマー' : session.personal_color_season === 'autumn' ? 'オータム' : session.personal_color_season === 'winter' ? 'ウィンター' : session.personal_color_season}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI提案（テキスト版フォールバック） */}
            {aiSuggestion && (
              <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
                <h3 className="font-bold text-[#333] mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4A574]" />
                  AIおすすめ提案
                </h3>
                <div className="space-y-3">
                  {aiSuggestion.colors && (aiSuggestion.colors as Array<{ name: string; code: string; desc: string }>).length > 0 && (
                    <div>
                      <p className="text-xs text-[#6B7280] mb-2">おすすめカラー</p>
                      <div className="space-y-2">
                        {(aiSuggestion.colors as Array<{ name: string; code: string; desc: string }>).map((color, i) => (
                          <div key={i} className="bg-[#FDFBF7] rounded-lg p-3 flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-full border border-[#e4e4e7] flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: color.code }}
                            />
                            <div>
                              <p className="font-bold text-sm text-[#333]">{color.name}</p>
                              <p className="text-xs text-[#6B7280] mt-0.5">{color.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiSuggestion.styles && (aiSuggestion.styles as Array<{ title: string; desc: string }>).length > 0 && (
                    <div>
                      <p className="text-xs text-[#6B7280] mb-2">おすすめスタイル</p>
                      <div className="space-y-2">
                        {(aiSuggestion.styles as Array<{ title: string; desc: string }>).map((style, i) => (
                          <div key={i} className="bg-[#FDFBF7] rounded-lg p-3">
                            <p className="font-bold text-sm text-[#333]">{style.title}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5">{style.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiSuggestion.advice && (aiSuggestion.advice as string[]).length > 0 && (
                    <div>
                      <p className="text-xs text-[#6B7280] mb-2">ホームケアアドバイス</p>
                      <ul className="space-y-1">
                        {(aiSuggestion.advice as string[]).map((tip, i) => (
                          <li key={i} className="text-sm text-[#333] bg-[#FDFBF7] rounded-lg p-3">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* データがない場合 */}
            {!concerns && !session.damage_level && !aiSuggestion && (
              <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7]/50 p-4">
                <div className="text-center py-8 text-[#6B7280]">
                  <p>カウンセリングデータを準備中です</p>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* フッター（レポート画像に含める） */}
      <footer className="text-center py-6 text-xs text-[#999]">
        <p>HAIR & MAKE peace</p>
      </footer>
      </div>{/* /report-content */}

      {/* レポート保存ボタン（画像には含めない） */}
      <div className="p-4 max-w-lg mx-auto">
        <SaveReportButton
          targetId="report-content"
          fileName={`peace-report-${date.replace(/\s/g, '')}.png`}
        />
      </div>

        {/* Google口コミ誘導バナー */}
        {(reviewUrlTakayanagi || reviewUrlHanado) && (
          <div className="p-4 max-w-lg mx-auto pb-8">
            <GoogleReviewBanner
              reviewUrlTakayanagi={reviewUrlTakayanagi}
              reviewUrlHanado={reviewUrlHanado}
              defaultStore="takayanagi"
              menuNames={session.selected_menus as string[] || []}
              concerns={concerns || []}
            />
          </div>
        )}
    </div>
  );
}
