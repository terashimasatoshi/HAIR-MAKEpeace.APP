'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCounseling } from "@/contexts/CounselingContext";
import { supabase } from "@/lib/supabase";

// Mock Data
// Product Data

const PRODUCTS = {
    color: [
        {
            category: "ハイカラー（H）",
            items: [
                { id: 'h1', name: 'ピンクH (P/h)', brand: 'High' },
                { id: 'h2', name: 'オレンジH (O/h)', brand: 'High' },
                { id: 'h3', name: 'マットH (M/h)', brand: 'High' },
                { id: 'h4', name: 'アッシュH (A/h)', brand: 'High' },
                { id: 'h5', name: 'ブラウンH (B/h)', brand: 'High' },
            ]
        },
        {
            category: "ビビッド（V）",
            items: [
                { id: 'v1', name: 'バイオレットV (V/v)', brand: 'Vivid' },
                { id: 'v2', name: 'ピンクV (P/v)', brand: 'Vivid' },
                { id: 'v3', name: 'ガーネットレッドV (GR/v)', brand: 'Vivid' },
                { id: 'v4', name: 'レッドV (R/v)', brand: 'Vivid' },
                { id: 'v5', name: 'オレンジV (O/v)', brand: 'Vivid' },
                { id: 'v6', name: 'イエローV (Y/v)', brand: 'Vivid' },
                { id: 'v7', name: 'マットV (M/v)', brand: 'Vivid' },
                { id: 'v8', name: 'アッシュV (A/v)', brand: 'Vivid' },
            ]
        },
        {
            category: "モデレート（M）",
            items: [
                { id: 'm1', name: 'ラベンダーM (L/m)', brand: 'Moderate' },
                { id: 'm2', name: 'パステルピンクM (PP/m)', brand: 'Moderate' },
                { id: 'm3', name: 'オレンジベージュM (OBE/m)', brand: 'Moderate' },
                { id: 'm4', name: 'イエローゴールドM (YG/m)', brand: 'Moderate' },
                { id: 'm5', name: 'シフォンマットM (CM/m)', brand: 'Moderate' },
                { id: 'm6', name: 'ミントアッシュM (MA/m)', brand: 'Moderate' },
                { id: 'm7', name: 'ナチュラルレッドM (NR/m)', brand: 'Moderate' },
                { id: 'm8', name: 'ナチュラルイエローM (NY/m)', brand: 'Moderate' },
                { id: 'm9', name: 'ナチュラルマットM (NU/m)', brand: 'Moderate' },
                { id: 'm10', name: 'ナチュラルプラチナM (NP/m)', brand: 'Moderate' },
                { id: 'm11', name: 'パールM (PE/m)', brand: 'Moderate' },
                { id: 'm12', name: 'アクアパールM (AP/m)', brand: 'Moderate' },
                { id: 'm13', name: 'ダルM (D/m)', brand: 'Moderate' },
                { id: 'm14', name: 'クレージュM (CG/m)', brand: 'Moderate' },
                { id: 'm15', name: 'ピンクグレージュM (PGQ/m)', brand: 'Moderate' },
                { id: 'm16', name: 'マットグレージュM (MGQ/m)', brand: 'Moderate' },
                { id: 'm17', name: 'アクアグレージュM (AGQ/m)', brand: 'Moderate' },
                { id: 'm18', name: 'ベビーピンクM (BP/m)', brand: 'Moderate' },
                { id: 'm19', name: 'ベビーオレンジM (BO/m)', brand: 'Moderate' },
                { id: 'm20', name: 'ベビーパープルM (BPU/m)', brand: 'Moderate' },
                { id: 'm21', name: 'ベビーブルーM (BB/m)', brand: 'Moderate' },
                { id: 'm22', name: 'ノーブルモーブM (NBM/m)', brand: 'Moderate' },
                { id: 'm23', name: 'ノーブルローズM (NBR/m)', brand: 'Moderate' },
            ]
        },
        {
            category: "ディープカラー（D）",
            items: [
                { id: 'd1', name: 'ナチュラルブラウンD (NB/d)', brand: 'Deep' },
                { id: 'd2', name: 'ナチュラルベージュブラウンD (NBB/d)', brand: 'Deep' },
                { id: 'd3', name: 'ナチュラルアッシュブラウンD (NAB/d)', brand: 'Deep' },
            ]
        },
        {
            category: "プロポーザルカラー",
            items: [
                // シアー
                { id: 'p1', name: 'シアーナチュラル (SN/m)', brand: 'Sheer' },
                // ライト
                { id: 'pl1', name: 'ホワイト (white+a1)', brand: 'Light' },
                { id: 'pl2', name: 'シルバー (silver+a1)', brand: 'Light' },
                { id: 'pl3', name: 'ペールベージュ (P beige1)', brand: 'Light' },
                { id: 'pl4', name: 'ベージュ (beige1)', brand: 'Light' },
                { id: 'pl5', name: 'ペールピンク (P pink1)', brand: 'Light' },
                { id: 'pl6', name: 'ペールコーラル (P coral1)', brand: 'Light' },
                { id: 'pl7', name: 'ペールグリーン (P green1)', brand: 'Light' },
                { id: 'pl8', name: 'ペールブルー (P blue1)', brand: 'Light' },
                // アクリル
                { id: 'ac1', name: 'アクリルパープル (A purple2)', brand: 'Acrylic' },
                { id: 'ac2', name: 'アクリルピンク (A pink2)', brand: 'Acrylic' },
                { id: 'ac3', name: 'アクリルレッド (A red2)', brand: 'Acrylic' },
                { id: 'ac4', name: 'アクリルオレンジ (A orange2)', brand: 'Acrylic' },
                { id: 'ac5', name: 'アクリルレモン (A lemon2)', brand: 'Acrylic' },
                { id: 'ac6', name: 'アクリルグリーン (A green2)', brand: 'Acrylic' },
                { id: 'ac7', name: 'アクリルブルー (A blue2)', brand: 'Acrylic' },
                // ネオカーム
                { id: 'nc1', name: 'カームベージュ (C beige/c)', brand: 'NeoCalm' },
                { id: 'nc2', name: 'カームプラム (C plum/c)', brand: 'NeoCalm' },
                { id: 'nc3', name: 'カームココア (C cocoa/c)', brand: 'NeoCalm' },
                { id: 'nc4', name: 'カームリーフ (C leaf/c)', brand: 'NeoCalm' },
                { id: 'nc5', name: 'カームラベンダー (C lavender/c)', brand: 'NeoCalm' },
                // ダーク
                { id: 'dk1', name: 'ダークグレー (D gray/d)', brand: 'Dark' },
                { id: 'dk2', name: 'ダークネイビー (D navy/d)', brand: 'Dark' },
                { id: 'dk3', name: 'ブルーブラック (blueblack/d)', brand: 'Dark' },
                // アクセント
                { id: 'acc1', name: 'パープルa (Purple-3)', brand: 'Accent' },
                { id: 'acc2', name: 'レッドa (Red-3)', brand: 'Accent' },
                { id: 'acc3', name: 'イエローa (Yellow-3)', brand: 'Accent' },
                { id: 'acc4', name: 'アッシュa (Ash-3)', brand: 'Accent' },
                { id: 'acc5', name: 'チャコールM a (Charcoal+12)', brand: 'Accent' },
                // クイック / トーンアップ / クリアー
                { id: 'q1', name: 'キューハイ (Q-High)', brand: 'Quick' },
                { id: 'q2', name: 'キューロウ (Q-Low)', brand: 'Quick' },
                { id: 'tup1', name: 'タイニーエヌアップ ハイ (TN-UP+H)', brand: 'ToneUp' },
                { id: 'tup2', name: 'タイニーエヌアップ (TN-UP)', brand: 'ToneUp' },
                { id: 'clr1', name: 'クリアー+ (CLEAR+)', brand: 'Clear' },
            ]
        }
    ],
    straight: [
        { id: 's1', name: 'NEO METEO クリーム ph10.5', brand: 'METEO' },
        { id: 's2', name: 'NEO METEO クリーム ph7.0', brand: 'METEO' },
        { id: 's3', name: 'NEO METEO クリーム ph4.5', brand: 'METEO' },
        { id: 's4', name: 'METEO インクライン', brand: 'METEO' },
        { id: 's5', name: 'METEO アルカリブースト', brand: 'METEO' },
        { id: 's6', name: 'リトーノH', brand: 'Other' },
        { id: 's7', name: 'H', brand: 'Other' },
        { id: 's8', name: 'N', brand: 'Other' },
        { id: 's9', name: 'シナジーB', brand: 'Other' },
    ],
    treatment: [
        { id: 't1', name: 'インカラミ 1', brand: 'TOKIO' },
        { id: 't2', name: 'インカラミ 2', brand: 'TOKIO' },
        { id: 't3', name: 'GLT 500g', brand: 'METEO' },
        { id: 't4', name: 'エアンス', brand: 'METEO' },
        { id: 't5', name: 'アンジー', brand: 'METEO' },
        { id: 't6', name: 'セルフォース', brand: 'METEO' },
        { id: 't7', name: 'キトフォース', brand: 'METEO' },
        { id: 't8', name: 'ケラフォース', brand: 'METEO' },
        { id: 't9', name: 'ネクター', brand: 'METEO' },
        { id: 't10', name: 'ベルバフ', brand: 'METEO' },
    ]
};

export default function TreatmentRecordPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.customerId as string;
    const { saveTreatment, stylist } = useCounseling();

    // State
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [finishDamage, setFinishDamage] = useState([2]);

    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    // Product Data
    type ProductItem = { id: string; name: string; brand: string; };

    // ... existing code ...

    // Explicitly typing items as any for simplicity in this replacement block, or define a type union
    const renderProductList = (type: keyof typeof PRODUCTS) => {
        const items = PRODUCTS[type];

        // If it's a categorized list (structure check)
        if (type === 'color') {
            return (
                <Accordion type="multiple" className="w-full space-y-2">
                    {(items as { category: string, items: ProductItem[] }[]).map((group, idx) => (
                        <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg bg-white px-3 shadow-sm data-[state=open]:border-primary/50">
                            <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline py-3">
                                {group.category}
                            </AccordionTrigger>
                            <AccordionContent className="pb-3 pt-1">
                                <div className="space-y-2">
                                    {group.items.map((product) => (
                                        <Card
                                            key={product.id}
                                            className={`
                                                  border shadow-sm cursor-pointer transition-colors
                                                  ${selectedProducts.includes(product.id) ? 'border-primary bg-primary/5' : 'border-border bg-white'}
                                              `}
                                            onClick={() => toggleProduct(product.id)}
                                        >
                                            <CardContent className="p-3 flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedProducts.includes(product.id)}
                                                    onCheckedChange={() => toggleProduct(product.id)}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                                                </div>
                                                {selectedProducts.includes(product.id) && (
                                                    <div className="w-20">
                                                        <Input
                                                            className="h-8 text-xs text-right"
                                                            placeholder="放置"
                                                            defaultValue="20分"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            );
        }

        // Flat list (straight, treatment)
        return (items as ProductItem[]).map((product) => (
            <Card
                key={product.id}
                className={`
                  border shadow-sm cursor-pointer transition-colors
                  ${selectedProducts.includes(product.id) ? 'border-primary bg-primary/5' : 'border-border bg-white'}
              `}
                onClick={() => toggleProduct(product.id)}
            >
                <CardContent className="p-3 flex items-center gap-3">
                    <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <div className="flex-1">
                        <p className="text-sm font-bold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    {selectedProducts.includes(product.id) && (
                        <div className="w-20">
                            <Input
                                className="h-8 text-xs text-right"
                                placeholder="放置"
                                defaultValue="20分"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        ));
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customerId}/counseling/plan`)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="font-bold">施術記録</span>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customerId}/treatment/photos`)}>
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">

                {/* 1. Selected Menu Summary */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">実施メニュー</h3>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/20">METEO</Badge>
                                <span className="font-medium">METEOカラー</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Badge variant="outline">Cut</Badge>
                                <span className="font-medium">デザインカット</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 2. Products Used */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">使用薬剤</h3>
                    <Tabs defaultValue="color" className="w-full">
                        <TabsList className="w-full grid grid-cols-3 mb-2">
                            <TabsTrigger value="color">カラー剤</TabsTrigger>
                            <TabsTrigger value="straight">ストレート剤</TabsTrigger>
                            <TabsTrigger value="treatment">TR剤</TabsTrigger>
                        </TabsList>

                        <TabsContent value="color" className="space-y-2 mt-0">
                            {renderProductList('color')}
                        </TabsContent>
                        <TabsContent value="straight" className="space-y-2 mt-0">
                            {renderProductList('straight')}
                        </TabsContent>
                        <TabsContent value="treatment" className="space-y-2 mt-0">
                            {renderProductList('treatment')}
                        </TabsContent>
                    </Tabs>
                </section>



                {/* 4. Result Evaluation */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">仕上がり評価</h3>
                    <div className="bg-white p-5 rounded-xl border border-border space-y-4">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span>ダメージレベル: Lv.{finishDamage}</span>
                            <Badge variant="outline" className="text-muted-foreground font-normal">Before: Lv.4</Badge>
                        </div>
                        <Slider
                            defaultValue={[2]}
                            max={5}
                            min={1}
                            step={1}
                            onValueChange={setFinishDamage}
                            className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1: 健康</span>
                            <span>5: ハイダメージ</span>
                        </div>
                    </div>
                </section>

                {/* 5. Notes for Next Visit */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">次回への申し送り</h3>
                    <Textarea
                        placeholder="次回来店時に気をつけるべきことを記入"
                        className="min-h-[100px] resize-none"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <Badge variant="secondary" className="cursor-pointer whitespace-nowrap">カラーの色落ち注意</Badge>
                        <Badge variant="secondary" className="cursor-pointer whitespace-nowrap">ホームケア必須</Badge>
                        <Badge variant="secondary" className="cursor-pointer whitespace-nowrap">2ヶ月以内再来</Badge>
                    </div>
                </section>

            </main>

            {/* Footer Button */}
            <div className="fixed bottom-0 w-full p-4 bg-white border-t border-border z-20">
                <Button
                    className="w-full text-lg h-12 shadow-md bg-primary text-white"
                    disabled={isSaving}
                    onClick={async () => {
                        setIsSaving(true);
                        try {
                            const success = await saveTreatment(customerId, {
                                selectedProducts,
                                finishDamageLevel: finishDamage[0],
                                notes
                            });

                            if (!success) {
                                console.error('Failed to save treatment record');
                                // Optional: Show toast or alert
                            }
                        } catch (err) {
                            console.error('Error:', err);
                        }
                        // 保存の成否に関わらず次の画面へ遷移
                        router.push(`/customers/${customerId}/treatment/photos`);
                    }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            次へ：写真登録
                        </>
                    )}
                </Button>
            </div>

        </div>
    );
}
