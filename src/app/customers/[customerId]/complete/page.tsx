'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCounseling } from "@/contexts/CounselingContext";

import { CheckCircle2, Home, Calendar, ChevronLeft, ClipboardCopy, Check, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { format, addWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

export default function CompletePage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.customerId as string;
    const searchParams = useSearchParams();
    const { customer, isLoadingCustomer, restoredSessionId, counselingSessionId: ctxSessionId } = useCounseling();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [shareUrl, setShareUrl] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Calculate next visit date (6 weeks later)
    const today = new Date();
    const nextVisitDate = addWeeks(today, 6);
    const formattedNextVisit = format(nextVisitDate, "M月d日（E）", { locale: ja });

    // セッションIDを取得: URLパラメータ → context → DB fallback
    useEffect(() => {
        const fromUrl = searchParams.get('session');
        const fromCtx = ctxSessionId || restoredSessionId;
        const resolved = fromUrl || fromCtx;

        if (resolved) {
            setSessionId(resolved);
            return;
        }
        // fallback: Service Role API経由で今日の最新セッションを取得
        (async () => {
            try {
                const res = await fetch(`/api/latest-session/${customerId}`);
                if (!res.ok) {
                    console.error('[CompletePage] Latest session API error:', res.status);
                    return;
                }
                const { sessionId: sid } = await res.json();
                if (sid) setSessionId(sid);
            } catch (err) {
                console.error('[CompletePage] Failed to fetch latest session:', err);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId]);

    // shareUrlはクライアントサイドでのみ生成（SSRでwindow参照を避ける）
    useEffect(() => {
        if (sessionId) {
            setShareUrl(`${window.location.origin}/share/counseling/${sessionId}`);
        }
    }, [sessionId]);

    const handleCopyUrl = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* 1. Header */}
            <header className="p-4 flex items-center justify-between border-b border-gray-100">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft />
                </Button>
                <div className="text-center">
                    <h1 className="text-lg font-bold tracking-tight text-primary">HAIR&MAKE peace</h1>
                    <p className="text-xs text-muted-foreground">本日はありがとうございました</p>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full px-6 py-4 flex flex-col justify-center space-y-8">

                {/* 2. Success Animation */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4"
                    >
                        <CheckCircle2 size={48} strokeWidth={3} />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">
                        {isLoadingCustomer ? "..." : (customer?.name || "お客様")} 様
                    </h2>
                    <p className="text-muted-foreground">施術記録を保存しました</p>
                </div>

                {/* 3. Summary Card */}
                <Card className="border-none shadow-sm bg-gray-50/50">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">実施メニュー</span>
                            <span className="font-medium">METEOカラー + カット</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">所要時間</span>
                            <span className="font-medium">90分</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                            <span className="text-muted-foreground flex items-center gap-1"><Calendar size={14} /> 次回推奨日</span>
                            <span className="font-bold text-primary">{formattedNextVisit} 頃</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Visit Message */}
                <div className="text-center">
                    <h4 className="font-bold text-sm">次回のご来店をお待ちしております</h4>
                </div>

                {/* QR Code Share Section */}
                {sessionId && (
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-5 flex flex-col items-center text-center space-y-4">
                            <h4 className="font-bold text-sm">カウンセリングレポートを共有</h4>
                            <div className="bg-white rounded-xl p-4">
                                <QRCodeSVG
                                    value={shareUrl}
                                    size={180}
                                    level="M"
                                    marginSize={2}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                お客様のスマホでQRコードを読み取ると、<br />
                                本日のカウンセリングレポートをご確認いただけます
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleCopyUrl}
                            >
                                {isCopied ? (
                                    <><Check className="mr-2 h-4 w-4 text-green-600" />コピーしました！</>
                                ) : (
                                    <><ClipboardCopy className="mr-2 h-4 w-4" />URLをコピー</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

            </main>

            {/* Footer Actions */}
            <footer className="p-6 pb-8 space-y-3 max-w-md mx-auto w-full">
                <Button
                    className="w-full h-12 text-lg shadow-md"
                    variant="default"
                    onClick={() => router.push(`/customers/${customerId}/treatment/photos`)}
                >
                    <Camera className="mr-2 h-5 w-5" />
                    仕上がり写真を撮影
                </Button>
                <Button
                    className="w-full h-12"
                    variant="outline"
                    onClick={() => router.push('/')}
                >
                    <Home className="mr-2 h-5 w-5" />
                    ホームに戻る
                </Button>
            </footer>
        </div>
    );
}
