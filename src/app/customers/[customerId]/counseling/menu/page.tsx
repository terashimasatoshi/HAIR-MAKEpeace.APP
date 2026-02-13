'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCounseling } from "@/contexts/CounselingContext";

// Menu Data
type MenuItem = { id: string; name: string; };
type MenuCategory = { category: string; items: MenuItem[]; };

const MENUS: MenuCategory[] = [
    {
        category: "カット",
        items: [
            { id: 'cut-1', name: 'カット' },
            { id: 'cut-2', name: '大学生デザインカット' },
            { id: 'cut-3', name: 'スクールカット（中高生）' },
            { id: 'cut-4', name: 'チャイルドカット（小学生）' },
            { id: 'cut-5', name: 'チャイルドカット（未就学児）' },
            { id: 'cut-6', name: '前髪カット' },
        ]
    },
    {
        category: "カラー",
        items: [
            { id: 'col-1', name: 'オーガニックカラー（リタッチ 2cm以内）' },
            { id: 'col-2', name: 'オーガニックカラー（ハーブOX使用）' },
            { id: 'col-3', name: 'ケアブリーチ' },
            { id: 'col-4', name: 'メテオカラー' },
            { id: 'col-5', name: 'マニキュア' },
            { id: 'col-6', name: 'ハイライト or インナーカラー（単品）' },
            { id: 'col-7', name: 'ハイライト or インナーカラー（追加）' },
        ]
    },
    {
        category: "パーマ",
        items: [
            { id: 'perm-1', name: 'オーガニックナチュラルパーマ' },
            { id: 'perm-2', name: 'ポイントパーマ' },
        ]
    },
    {
        category: "ストレート",
        items: [
            { id: 'str-1', name: 'メテオストレート' },
            { id: 'str-2', name: '学割U18オーガニックストレート' },
            { id: 'str-3', name: 'メテオ前髪ストレート（単品）' },
            { id: 'str-4', name: '前髪ストレート（単品）' },
            { id: 'str-5', name: 'METEO前髪ストレート（組み合わせ）' },
            { id: 'str-6', name: '前髪ストレート（組み合わせ）' },
        ]
    },
    {
        category: "トリートメント",
        items: [
            { id: 'tr-1', name: 'ナチュラルヒーリングトリートメント（単品）' },
            { id: 'tr-2', name: 'ナチュラルヒーリングトリートメント（組み合わせ）' },
            { id: 'tr-3', name: 'ローズオイルスパ（単品）' },
            { id: 'tr-4', name: 'ローズオイルスパ（組み合わせ）' },
            { id: 'tr-5', name: 'シェルパトリートメント' },
            { id: 'tr-6', name: '水素トリートメント' },
        ]
    },
    {
        category: "ヘアセット",
        items: [
            { id: 'set-1', name: 'アップスタイル' },
            { id: 'set-2', name: 'ハーフアップ' },
            { id: 'set-3', name: 'ダウンスタイル' },
        ]
    },
    {
        category: "ヘッドスパ",
        items: [
            { id: 'spa-1', name: 'オーガニックヘッドスパ（組み合わせ）' },
            { id: 'spa-2', name: 'ヘッドスパ（単品）' },
            { id: 'spa-3', name: '頭浸浴（組み合わせ）' },
            { id: 'spa-4', name: '頭浸浴（単品）' },
        ]
    },
    {
        category: "その他",
        items: [
            { id: 'other-1', name: 'オーガニックアロマシャンプー' },
            { id: 'other-2', name: '着付け' },
            { id: 'other-3', name: '直し（二週間保障）' },
        ]
    }
];

export default function MenuSelectionPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.customerId as string;

    const { data, updateData, customer, isLoadingCustomer } = useCounseling();
    const { selectedMenus, damageLevel, personalColor } = data;
    // We can also show damage level here if needed, etc.

    const toggleMenu = (id: string) => {
        const newMenus = selectedMenus.includes(id)
            ? selectedMenus.filter(m => m !== id)
            : [...selectedMenus, id];
        updateData({ selectedMenus: newMenus });
    };

    const getSelectedMenuNames = () => {
        const allItems = MENUS.flatMap(cat => cat.items);
        return allItems.filter(item => selectedMenus.includes(item.id)).map(item => item.name);
    };

    const selectedNames = getSelectedMenuNames();

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* 1. Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="font-bold">本日のメニュー</span>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customerId}/counseling/plan`)}>
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">

                {/* 2. Customer Info Summary */}
                <div className="flex items-center gap-2 px-1">
                    {isLoadingCustomer ? (
                        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                        <span className="font-bold text-lg">{customer?.name || "ゲスト"} 様</span>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {customer?.age ? `${customer.age}歳` : ""}
                    </span>
                    <Badge variant="outline" className="ml-auto border-dashed">ハイダメージ (Lv.{damageLevel})</Badge>
                </div>

                {/* 3. Menu Accordion */}
                <Accordion type="multiple" defaultValue={["item-0"]} className="w-full space-y-2">
                    {MENUS.map((group, idx) => (
                        <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg bg-white px-3 shadow-sm data-[state=open]:border-primary/50">
                            <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline py-3">
                                {group.category}
                            </AccordionTrigger>
                            <AccordionContent className="pb-3 pt-1">
                                <div className="space-y-1">
                                    {group.items.map((menu) => (
                                        <div
                                            key={menu.id}
                                            className={`
                                                relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                                                ${selectedMenus.includes(menu.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}
                                            `}
                                            onClick={() => toggleMenu(menu.id)}
                                        >
                                            <Checkbox
                                                checked={selectedMenus.includes(menu.id)}
                                                onCheckedChange={() => toggleMenu(menu.id)}
                                                className="shrink-0"
                                            />
                                            <span className="text-sm font-medium leading-tight">{menu.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </main>

            {/* 5. Summary & Footer */}
            {(selectedMenus.length > 0) && (
                <div className="fixed bottom-0 w-full bg-white border-t border-border z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-muted-foreground">選択中メニュー</p>
                                <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">{selectedMenus.length}個</span>
                            </div>
                            <p className="font-bold line-clamp-2 text-primary">{selectedNames.join(', ')}</p>
                        </div>
                    </div>
                    <div className="p-4">
                        <Button
                            className="w-full text-lg h-12 shadow-md bg-gradient-to-r from-primary to-[#5C8D6D] hover:from-[#3D6949] hover:to-[#4A7C59]"
                            onClick={() => router.push(`/customers/${customerId}/counseling/plan`)}
                        >
                            次へ：AI提案を見る
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
