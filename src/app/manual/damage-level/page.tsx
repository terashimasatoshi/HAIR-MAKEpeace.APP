import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, HelpCircle, Activity, AlertTriangle, ArrowRight, Check } from "lucide-react";

export default function DamageDiagnosticsManualPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-800 p-6 md:p-12">
            <main className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="border-primary text-primary px-4 py-1">Manual</Badge>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        ダメージ診断ナレッジ
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        ※本データは、「ダメージ診断ナレッジ」PDFの内容（フローチャート＋レベル別説明）を、現場で参照しやすいように整形したものです。
                    </p>
                </div>

                {/* 1. Flowchart */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 border-b pb-2">
                        <Activity className="h-6 w-6 text-primary" />
                        ダメージ診断フローチャート
                    </h2>

                    <div className="space-y-6 relative">
                        {/* Step 1 */}
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                            <p className="font-bold flex items-center gap-2 mb-2"><Badge className="bg-blue-500">Q1</Badge> カラー・縮毛矯正をしている？</p>
                            <div className="flex gap-4 ml-2">
                                <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-blue-400">
                                    <strong>YES</strong> → Q2へ
                                </div>
                                <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-gray-300">
                                    <strong>NO</strong> → Q1-2へ
                                </div>
                            </div>
                        </div>

                        {/* Step 1-2 & 1 Branches */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Branch YES (Q2) */}
                            <div className="space-y-4">
                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <p className="font-bold flex items-center gap-2 mb-2"><Badge className="bg-blue-500">Q2</Badge> パサつき、艶がない／まとまらない？</p>
                                    <div className="flex gap-4 ml-2">
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-blue-400">
                                            <strong>YES</strong> → Q3へ
                                        </div>
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-gray-300">
                                            <strong>NO</strong> → Q2-2へ
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <p className="font-bold flex items-center gap-2 mb-2"><Badge className="bg-blue-500">Q3</Badge> 枝毛・切れ毛が気になる？</p>
                                    <div className="flex gap-4 ml-2">
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-blue-400">
                                            <strong>YES</strong> → Q4へ
                                        </div>
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-gray-300">
                                            <strong>NO</strong> → Q3-2へ
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Branch NO (Q1-2) */}
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <p className="font-bold flex items-center gap-2 mb-2"><Badge variant="secondary">Q1-2</Badge> 艶がなく／手触りが悪い？</p>
                                    <div className="flex gap-4 ml-2">
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-blue-400">
                                            <strong>YES</strong> → Q2-2へ
                                        </div>
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-green-500">
                                            <strong>NO</strong> → <span className="font-bold text-green-600">レベル 1</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <p className="font-bold flex items-center gap-2 mb-2"><Badge variant="secondary">Q2-2</Badge> 髪が絡まり／ゴワゴワする？</p>
                                    <div className="flex gap-4 ml-2">
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-blue-400">
                                            <strong>YES</strong> → Q3-2へ
                                        </div>
                                        <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-green-500">
                                            <strong>NO</strong> → <span className="font-bold text-green-600">レベル 2</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Deeper Levels */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                                <p className="font-bold flex items-center gap-2 mb-2"><Badge className="bg-yellow-500">Q3-2</Badge> 濡らした時／クシ通りが悪い？</p>
                                <div className="flex gap-4 ml-2">
                                    <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-orange-500">
                                        <strong>YES</strong> → <span className="font-bold text-orange-600">レベル 6</span>
                                    </div>
                                    <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-green-500">
                                        <strong>NO</strong> → <span className="font-bold text-green-600">レベル 4</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                                <p className="font-bold flex items-center gap-2 mb-2"><Badge className="bg-orange-500">Q4</Badge> ブリーチをしている？</p>
                                <div className="flex gap-4 ml-2">
                                    <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-red-500">
                                        <strong>YES</strong> → Q5へ
                                    </div>
                                    <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-orange-500">
                                        <strong>NO</strong> → <span className="font-bold text-orange-600">レベル 6</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 max-w-md mx-auto">
                            <p className="font-bold flex items-center gap-2 mb-2"><Badge className="bg-red-600">Q5</Badge> 濡らした時に からまる、伸びる？</p>
                            <div className="flex gap-4 ml-2">
                                <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-red-700">
                                    <strong>YES</strong> → <span className="font-bold text-red-700 text-lg">レベル 10</span>
                                </div>
                                <div className="flex-1 bg-white p-2 rounded shadow-sm text-sm border-l-4 border-red-400">
                                    <strong>NO</strong> → <span className="font-bold text-red-500 text-lg">レベル 8</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 2. Level Details */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-center mb-6">ダメージレベル別・詳細ステータス</h2>
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Level 1 / 2 */}
                        <Card className="border-l-8 border-l-green-400">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between">
                                    <span>レベル 1 / 2</span>
                                    <Badge variant="secondary">軽度</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">ツヤ・光沢</span>
                                    <p>均一に美しいツヤがある / 手触りは一部落ちる</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">指通り</span>
                                    <p>スムーズ / 水分をはじく</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">推奨ケア</span>
                                    <p className="font-bold text-green-700">2ヶ月に1回メンテナンス</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Level 4 */}
                        <Card className="border-l-8 border-l-yellow-400">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between">
                                    <span>レベル 4</span>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">中度</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">ツヤ・光沢</span>
                                    <p>ツヤあるがパサつく部分あり</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">指通り</span>
                                    <p>ひっかかり / 弾力低下 / ゴワつき</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">推奨ケア</span>
                                    <p className="font-bold text-yellow-700">1.5ヶ月に1回 / 髪質改善 半年</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Level 6 / 8 */}
                        <Card className="border-l-8 border-l-orange-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between">
                                    <span>レベル 6 / 8</span>
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">重度</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">ツヤ・光沢</span>
                                    <p>ツヤ鈍い / 乾燥 / パサつき目立つ</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">指通り</span>
                                    <p>ザラつく / 水分吸う / ひっかかり</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">要因</span>
                                    <p>ブリーチ / 熱処理 / エイジング / ケア不足</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">推奨ケア</span>
                                    <p className="font-bold text-orange-700">1〜1.5ヶ月に1回 / 髪質改善 8ヶ月〜1年</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Level 10 */}
                        <Card className="border-l-8 border-l-red-600 bg-red-50/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between text-red-700">
                                    <span>レベル 10</span>
                                    <Badge variant="destructive">危険</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">ツヤ・光沢</span>
                                    <p className="font-bold text-red-600">過収縮（ビリビリ） / 過度なパサつき</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">指通り</span>
                                    <p className="font-bold text-red-600">切れる / ゴムのように伸びる</p>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-bold text-muted-foreground text-xs uppercase pt-1">推奨ケア</span>
                                    <p className="font-bold text-red-700">1ヶ月に1回必須 / 髪質改善 1年以上</p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </section>

                {/* 3. Footer Memo */}
                <section className="bg-gray-100 p-6 rounded-lg text-sm text-gray-600">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" /> 現場用メモ
                    </h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>主観評価が多いので、スタッフ間で言葉の定義を揃えましょう。</li>
                        <li>迷ったら<strong>「濡らした時の変化（クシ通り／からまり／伸び）」</strong>を優先して確認すると、レベル6以上の切り分けがしやすいです。</li>
                    </ul>
                </section>

            </main>
        </div>
    );
}
