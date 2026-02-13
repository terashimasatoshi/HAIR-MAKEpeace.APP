'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Scissors, Star, Check, Sparkles, Share2, ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCounseling } from "@/contexts/CounselingContext";

// Mock Data from AI
// Mock Data Generator based on Matching Knowledge
// Mock Data Generator based on Matching Knowledge
const getMockProposal = (faceShapeLabel: string, personalColor: string) => {
    // Default fallback
    const summary = { faceShape: faceShapeLabel, personalColor, matchRate: 85 };
    let advice = ["似合わせの基本を意識", "なりたい印象に合わせて調整", "スタイリングでカバー"];
    let analysis = "顔型に合わせたスタイリングで、より魅力を引き出せます。";
    let styles = [
        { id: 1, title: "ひし形レイヤー", desc: "骨格補正の王道スタイル" },
        { id: 2, title: "ゆるふわ巻き", desc: "柔らかい印象をプラス" },
        { id: 3, title: "くびれミディ", desc: "トレンド感のあるシルエット" }
    ];

    // Colors Logic based on Personal Color Knowledge
    let colors = [
        { name: "アッシュベージュ", code: "#C0B298", desc: "透明感のある柔らかい印象に" },
        { name: "ラベンダーグレー", code: "#9D9CB5", desc: "黄みを抑えて肌の透明感アップ" },
        { name: "ココアブラウン", code: "#8B6A56", desc: "落ち着きのある上品な艶髪" }
    ];

    // Determine Base (Blue Base or Yellow Base)
    const isBlueBase = personalColor.includes("Summer") || personalColor.includes("Winter") || personalColor.includes("ブルベ");
    const isYellowBase = personalColor.includes("Spring") || personalColor.includes("Autumn") || personalColor.includes("イエベ");

    if (isBlueBase) {
        colors = [
            { name: "ラベンダーアッシュ", code: "#9494B8", desc: "黄みを消して透明感をアップ" },
            { name: "ダークグレージュ", code: "#5A5A5A", desc: "赤みを抑えたクールな印象" },
            { name: "ココアブラウン", code: "#6B4423", desc: "落ち着きのある上品な深み" },
            { name: "ピンクパープル", code: "#B88AA8", desc: "肌の白さを引き立てる血色感" },
            { name: "ブルーブラック", code: "#0F172A", desc: "洗練されたモードな黒髪" }
        ];
    } else if (isYellowBase) {
        colors = [
            { name: "シフォンベージュ", code: "#E8DCC5", desc: "肌なじみの良い柔らかカラー" },
            { name: "オリーブブラウン", code: "#808000", desc: "赤みを抑えた大人っぽい印象" },
            { name: "オレンジブラウン", code: "#A0522D", desc: "血色感をプラスしてヘルシーに" },
            { name: "ミルクティー", code: "#D2B48C", desc: "まろやかな色味で優しげに" },
            { name: "カッパーブラウン", code: "#B87333", desc: "ツヤ感重視のリッチなブラウン" }
        ];
    }


    switch (faceShapeLabel) {
        case "面長":
            advice = [
                "頬の位置にボリュームを出して横幅をプラス",
                "前髪を作って縦の長さを分断",
                "トップのボリュームは控えめに"
            ];
            analysis = "【面長さんへの似合わせ】\n縦長印象を和らげるため、「アウトフォーム」では頬の位置にボリュームを出し、横のラインを作ります。「インフォーム」では前髪を作り、おでこを隠すことで顔の縦幅を短く見せます。また、サイドバングを少し広めにとり、肌の露出面積を調整することで、卵型のようなバランスの良いシルエットに近づけます。";
            styles = [
                { id: 1, title: "ワイドバングボブ", desc: "前髪を広めにとり、横幅を強調してバランス調整" },
                { id: 2, title: "ヨシンモリ（くびれ）", desc: "頬横にボリュームが出る巻き髪で華やかに" },
                { id: 3, title: "マッシュウルフ", desc: "顔周りに動きを出して視線を横に散らす" }
            ];
            break;
        case "丸型":
        case "丸顔":
            advice = [
                "トップに高さを出して縦ラインを強調",
                "頬周りはタイトに締める",
                "シースルーバングで額を見せる"
            ];
            analysis = "【丸顔さんへの似合わせ】\n丸みをすっきり見せるため、「アウトフォーム」ではトップに高さを出し、縦長のシルエットを作ります。「インフォーム」では頬の位置を髪で隠してシャープに見せつつ、前髪はシースルーバングで額の肌色を見せ、縦の抜け感を演出します。サイドバングは長めに残し、フェイスラインを包み込むようにするのがポイントです。";
            styles = [
                { id: 1, title: "かき上げロング", desc: "おでこを出して縦ラインを強調し、大人っぽく" },
                { id: 2, title: "ひし形ショート", desc: "トップに高さを出し、襟足をタイトに締める" },
                { id: 3, title: "センターパート", desc: "顔の中心に縦線を作り、丸みをカバー" }
            ];
            break;
        case "ベース型":
            advice = [
                "エラ周りに動きを出してカバー",
                "トップに高さを出してハチ張りを緩和",
                "曲線的なラインで柔らかさをプラス"
            ];
            analysis = "【ベース型さんへの似合わせ】\nエラ張りや四角い印象を和らげるため、「アウトフォーム」ではトップに高さを出して視線を上に誘導します。「インフォーム」ではエラ部分をサイドの髪や後れ毛でカバーし、肌の露出を卵型に近づけます。前髪は隙間のあるデザインにし、直線を避けて曲線的なカールをつけることで、女性らしく柔らかい印象になります。";
            styles = [
                { id: 1, title: "ニュアンスパーマ", desc: "曲線的な動きで骨格の角ばりをぼかす" },
                { id: 2, title: "フェザーバング", desc: "顔周りに外ハネを作り、エラから視線を逸らす" },
                { id: 3, title: "レイヤーロング", desc: "顔周りの段差で動きを出し、輪郭をソフトに" }
            ];
            break;
        case "逆三角形":
            advice = [
                "あご周りにボリュームを出してふんわり",
                "ハチ周りはタイトに抑える",
                "前髪の幅は狭めに設定"
            ];
            analysis = "【逆三角形さんへの似合わせ】\nシャープな顎周りを優しく見せるため、「アウトフォーム」ではあご〜首元にかけてボリュームや動きを出します。逆にハチ周りは抑えて頭の形をきれいに見せます。「インフォーム」では前髪の幅を狭くとり、横幅を強調しすぎないようにします。全体的にふんわりとしたAライン気味のシルエットが似合います。";
            styles = [
                { id: 1, title: "Aラインボブ", desc: "毛先に重みを残し、あご周りの寂しさをカバー" },
                { id: 2, title: "外ハネミディ", desc: "首元のくびれと外ハネで、視線を下に集める" },
                { id: 3, title: "韓国風レイヤー", desc: "顔周りのリバース巻きで華やかさと柔らかさを" }
            ];
            break;
    }

    return {
        summary,
        colors: colors.slice(0, 3),
        styles,
        advice,
        aiAnalysis: analysis
    };
};

export default function AiProposalPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.customerId as string;
    const { data, saveToSupabase, customer, isLoadingCustomer } = useCounseling();
    const [selectedColor, setSelectedColor] = useState<any>(null);
    const [proposal, setProposal] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSuggestion = async () => {
            setIsLoading(true);
            try {
                const mapCustomerFaceShapeToForm: Record<string, string> = {
                    oval: "egg",
                    round: "round",
                    square: "base",
                    heart: "triangle",
                    oblong: "long",
                    egg: "egg",
                    base: "base",
                    triangle: "triangle",
                    long: "long",
                };
                const mapCustomerColorTypeToForm: Record<string, "warm" | "cool"> = {
                    yellowbase: "warm",
                    bluebase: "cool",
                    warm: "warm",
                    cool: "cool",
                };

                const fallbackFaceShape = mapCustomerFaceShapeToForm[(customer as any)?.face_shape] || "";
                const fallbackColorBase = mapCustomerColorTypeToForm[(customer as any)?.personal_color_type] || "";
                const fallbackColorSeason = (customer as any)?.personal_color || "";
                const effectiveFaceShape = data.faceShape || fallbackFaceShape;
                const effectivePersonalSeason = data.personalColor?.season || fallbackColorSeason;
                const effectivePersonalBase = data.personalColor?.base || fallbackColorBase;

                // Map Data ID to Label for better AI understanding
                const FACE_SHAPE_MAP: Record<string, string> = {
                    "egg": "卵型",
                    "round": "丸型",
                    "long": "面長",
                    "base": "ベース型",
                    "triangle": "逆三角形"
                };
                const faceShapeLabel = FACE_SHAPE_MAP[effectiveFaceShape] || effectiveFaceShape || "卵型";
                console.log("[PlanPage] Sending to API:", { faceShapeLabel, data });

                const res = await fetch('/api/ai-suggestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        faceShape: faceShapeLabel,
                        personalColor: effectivePersonalSeason || "spring (default)",
                        personalColorBase: effectivePersonalBase || "warm",
                        concerns: data.concerns,
                        request: data.request || ''
                    })
                });

                if (!res.ok) throw new Error("Failed to fetch suggestion");

                const result = await res.json();
                console.log("[PlanPage] Received from API:", result);
                setProposal(result);
            } catch (err) {
                console.error("[PlanPage] Error fetching AI", err);
                setError("AIの提案を取得できませんでした。デモデータ（顔型反映版）を表示します。");

                // Fallback to dynamic mock data
                const FACE_SHAPE_MAP: Record<string, string> = {
                    "egg": "卵型",
                    "round": "丸型",
                    "long": "面長",
                    "base": "ベース型",
                    "triangle": "逆三角形"
                };
                const fsLabel = FACE_SHAPE_MAP[data.faceShape] || data.faceShape || "卵型";
                const mock = getMockProposal(fsLabel, data.personalColor?.season || "診断中");
                setProposal(mock);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestion();
    }, [data]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">AIがあなたに似合うスタイルを分析中...</p>
            </div>
        );
    }

    if (!proposal) return null; // Or error state

    // Use fetched proposal instead of PROPOSAL_DATA
    const displayData = proposal;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-24 font-sans text-foreground">
            {/* 1. Header */}
            <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-border/40 shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customerId}/counseling/menu`)} className="-ml-2">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight text-primary">HAIR&MAKE peace</h1>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold">
                        {isLoadingCustomer ? "..." : (customer?.name || "ゲスト")} 様
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-8 space-y-8">

                {/* 2. Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-6">
                        <Badge variant="outline" className="mb-2 border-accent text-accent px-3 py-1 text-xs">AI Analysis Result</Badge>
                        <h2 className="text-2xl font-bold text-gray-800">あなたに似合うスタイル</h2>
                    </div>

                    <Card className="border-none shadow-lg bg-white overflow-hidden relative">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary">
                                        <SmileIcon />
                                    </div>
                                    <span className="font-bold text-sm">{displayData.summary?.faceShape || "診断中"}</span>
                                </div>
                                <div className="text-muted-foreground">×</div>
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                                        <PaletteIcon />
                                    </div>
                                    <span className="font-bold text-sm">{displayData.summary?.personalColor || "診断中"}</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                あなたの魅力を最大限に引き出す<br />
                                ベストマッチな組み合わせです。
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 3. Recommended Colors */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h3 className="section-title mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        <span className="font-bold text-lg">おすすめカラー</span>
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {displayData.colors?.map((color: any, idx: number) => (
                            <button
                                key={idx}
                                className="flex-shrink-0 w-28 group"
                                onClick={() => setSelectedColor(color)}
                            >
                                <div
                                    className="h-28 w-28 rounded-2xl shadow-md mb-2 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg relative overflow-hidden"
                                    style={{ backgroundColor: color.code }}
                                >
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                                <p className="text-xs font-bold text-center group-hover:text-primary transition-colors">{color.name}</p>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* 4. Recommended Styles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h3 className="section-title mb-4 flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-accent" />
                        <span className="font-bold text-lg">似合う顔周りスタイル</span>
                    </h3>
                    <div className="space-y-4">
                        {displayData.styles?.map((style: any, idx: number) => (
                            <Card key={idx} className="overflow-hidden border-none shadow-md group">
                                {/* Removed Image Placeholder as requested - Text Only Mode */}
                                <CardContent className="p-5 bg-white flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Scissors className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1 text-primary text-base">{style.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{style.desc}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>

                {/* 5. Styling Advice & Explanation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6"
                >
                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Star className="h-5 w-5 text-accent" />
                            スタイリングのポイント
                        </h3>
                        <ul className="space-y-2">
                            {displayData.advice?.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="font-bold text-sm mb-2 text-gray-500">AIからのアドバイス</h3>
                        <p className="text-sm text-gray-600 leading-7">
                            {displayData.aiAnalysis}
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* 6. Action Buttons */}
            <div className="fixed bottom-0 w-full p-4 bg-white border-t border-border z-20 flex gap-3">
                <Button variant="outline" className="flex-1 h-12 border-primary text-primary hover:bg-primary/5">
                    <Share2 className="mr-2 h-4 w-4" />
                    保存
                </Button>
                <Button
                    className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white shadow-lg"
                    disabled={isSaving}
                    onClick={async () => {
                        setIsSaving(true);
                        try {
                            // Supabaseにカウンセリングデータを保存
                            await saveToSupabase(customerId, proposal);
                        } catch (err) {
                            console.error('Save error:', err);
                        }
                        // 保存の成否に関わらず次の画面へ遷移
                        router.push(`/customers/${customerId}/treatment/record`);
                    }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        '施術に進む'
                    )}
                </Button>
            </div>

            {/* Dialogs */}
            <Dialog open={!!selectedColor} onOpenChange={() => setSelectedColor(null)}>
                <DialogContent className="max-w-xs rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedColor?.name}</DialogTitle>
                        <DialogDescription>{selectedColor?.desc}</DialogDescription>
                    </DialogHeader>
                    <div
                        className="w-full h-32 rounded-xl mt-4 shadow-inner"
                        style={{ backgroundColor: selectedColor?.code }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Simple Icon Components for specific usage
function SmileIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>
    )
}

function PaletteIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>
    )
}
