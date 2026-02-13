import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

export default function PersonalColorManualPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-800 p-6 md:p-12">
            <main className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="border-primary text-primary px-4 py-1">Manual</Badge>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        美容室で使える<br className="md:hidden" />ブルベ・イエベ簡易診断マニュアル
                    </h1>
                </div>

                {/* 1. Overview */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
                        <Info className="h-5 w-5 text-primary" />
                        概要
                    </h2>
                    <ul className="space-y-2 text-sm md:text-base">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            特別な道具不要、身体的特徴のみで判断
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            メイク・服・ヘアカラーの影響を避け、地肌・地毛・瞳を自然光下で観察
                        </li>
                    </ul>
                </section>

                {/* 2. Check Items */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-center">チェック項目一覧</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Skin */}
                        <Card>
                            <CardHeader className="bg-orange-50/50 pb-2">
                                <CardTitle className="text-base font-bold text-orange-800">肌の特徴</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-sm">
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-orange-200 pl-2">手首の血管色</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>緑っぽい → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>青〜紫っぽい → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-orange-200 pl-2">手のひらの色</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>オレンジ・黄み → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>ローズ・青み → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-orange-200 pl-2">肌質と透明感</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>黄み肌、マット → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>透明感、青白い → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-orange-200 pl-2">日焼けの変化</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>小麦色、定着 → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>赤くなる、戻る → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Hair */}
                        <Card>
                            <CardHeader className="bg-gray-50 pb-2">
                                <CardTitle className="text-base font-bold text-gray-800">髪の特徴</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-sm">
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-gray-300 pl-2">地毛の色味</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>ブラウン・黄み → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>黒・グレー寄り → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-gray-300 pl-2">髪質の傾向</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>細い・ツヤあり → <span className="text-orange-600 font-bold">イエベ春</span></li>
                                        <li>太い・深みツヤ → <span className="text-blue-600 font-bold">ブルベ冬</span></li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Eyes */}
                        <Card>
                            <CardHeader className="bg-blue-50/50 pb-2">
                                <CardTitle className="text-base font-bold text-blue-800">瞳・目元の特徴</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-sm">
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-blue-200 pl-2">虹彩の色</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>明るい茶色 → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>黒・ダーク茶 → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-blue-200 pl-2">白目の色</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>アイボリー系 → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>青白く澄んだ白 → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold mb-1 border-l-4 border-blue-200 pl-2">印象</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>キラキラ親しみ → <span className="text-orange-600 font-bold">イエベ</span></li>
                                        <li>クールで澄んでる → <span className="text-blue-600 font-bold">ブルベ</span></li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* 3. Caution */}
                <section className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        注意点
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-red-800">
                        <li>肌の明るさ（色白・色黒）での判断は誤りです。</li>
                        <li>単一の特徴ではなく、<strong>総合的に判断</strong>してください。</li>
                        <li>メイク・カラーコンタクト・染髪などの影響を避けてください。</li>
                        <li>判断はなるべく<strong>自然光下</strong>で行ってください。</li>
                        <li>判断が難しい場合はニュートラル（グリベ）の可能性も考慮してください。</li>
                    </ul>
                </section>

                {/* 4. Workflow */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        現場での活用フロー
                    </h2>
                    <div className="space-y-4">
                        {[
                            "手首の血管色を見る → 青系 or 緑系？",
                            "手のひらの色合いを見る → ローズ or オレンジ系？",
                            "首元や耳後ろなどの地肌の色味を確認",
                            "生え際や眉毛で地毛の色を確認",
                            "瞳と白目のコントラストを見る",
                            "日焼け時の傾向を聞き出す（例：「焼けると黒くなりやすいですか？」）"
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm md:text-base font-medium">{step}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Footer Remarks */}
                <div className="text-center text-sm text-muted-foreground border-t pt-8">
                    <p>迷った場合は決めつけず、後日照明や体調の良い日に再チェックしましょう。</p>
                    <p className="mt-1">診断よりも「似合う提案」を目的に活用してください。</p>
                </div>

            </main>
        </div>
    );
}
