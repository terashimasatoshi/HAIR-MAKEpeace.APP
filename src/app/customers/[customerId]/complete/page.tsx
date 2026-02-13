'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCounseling } from "@/contexts/CounselingContext"; // Import Context

import { CheckCircle2, Home, Share2, Calendar, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { format, addWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function CompletePage() {
    const router = useRouter();
    const { customer, isLoadingCustomer } = useCounseling(); // Use Context

    // Calculate next visit date (6 weeks later)
    const today = new Date();
    const nextVisitDate = addWeeks(today, 6);
    const formattedNextVisit = format(nextVisitDate, "M月d日（E）", { locale: ja });

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



                {/* 5. Next Appointment CTA */}
                <div className="text-center space-y-2">
                    <h4 className="font-bold text-sm">次回のご来店をお待ちしております</h4>
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                        次回予約を入れる (Web予約)
                    </Button>
                </div>

            </main>

            {/* 6. Footer Actions */}
            <footer className="p-6 pb-8 space-y-3 max-w-md mx-auto w-full">
                <Button
                    className="w-full h-12 text-lg shadow-md"
                    variant="default"
                    onClick={() => router.push('/')}
                >
                    <Home className="mr-2 h-5 w-5" />
                    ホームに戻る
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground text-sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    メール/SMSで送る
                </Button>
            </footer>
        </div>
    );
}
