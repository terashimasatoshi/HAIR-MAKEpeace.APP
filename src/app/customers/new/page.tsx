'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { ENABLE_LOCAL_FALLBACK } from "@/lib/runtime-flags";
import { cn } from "@/lib/utils";

const CONCERN_CATEGORIES = {
    damage: {
        label: "ダメージ系",
        items: ["パサつき", "枝毛", "切れ毛", "ごわつき"]
    },
    scalp: {
        label: "頭皮系",
        items: ["かゆみ", "フケ", "乾燥", "べたつき"]
    },
    aging: {
        label: "エイジング系",
        items: ["うねり", "ハリ不足", "ツヤ不足", "白髪"]
    }
};

export default function NewCustomerPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [kana, setKana] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [concerns, setConcerns] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [kanaEdited, setKanaEdited] = useState(false);
    const composingRef = useRef('');

    // ひらがな → カタカナ変換
    const toKatakana = (str: string) =>
        str.replace(/[\u3041-\u3096]/g, (ch) =>
            String.fromCharCode(ch.charCodeAt(0) + 0x60)
        );

    // IMEの変換前テキスト（ひらがな）を収集
    const handleCompositionUpdate = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
        composingRef.current = e.data || '';
    }, []);

    // IME確定時にカナフィールドへ反映
    const handleCompositionEnd = useCallback(() => {
        if (!kanaEdited && composingRef.current) {
            setKana(prev => prev + toKatakana(composingRef.current));
        }
        composingRef.current = '';
    }, [kanaEdited]);

    const toggleConcern = (concern: string) => {
        setConcerns(prev =>
            prev.includes(concern)
                ? prev.filter(c => c !== concern)
                : [...prev, concern]
        );
    };

    const saveLocalCustomer = () => {
        const localId = `local-${Date.now()}`;
        const payload = {
            id: localId,
            name: name.trim(),
            kana: kana.trim() || null,
            age: age ? parseInt(age, 10) : null,
            phone: phone.trim() || null,
            created_at: new Date().toISOString(),
        };
        const raw = localStorage.getItem('peace_local_customers');
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem('peace_local_customers', JSON.stringify([payload, ...existing]));
        return localId;
    };

    const buildNextUrl = (customerId: string) => {
        const base = `/customers/${customerId}/counseling/input`;
        if (concerns.length === 0) return base;
        return `${base}?concerns=${encodeURIComponent(concerns.join(','))}`;
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('名前は必須です');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data, error: insertError } = await supabase
                .from('customers')
                .insert({
                    name: name.trim(),
                    kana: kana.trim() || null,
                    age: age ? parseInt(age, 10) : null,
                    phone: phone.trim() || null,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                if (ENABLE_LOCAL_FALLBACK) {
                    const localId = saveLocalCustomer();
                    setError('Supabaseへ保存できないため、ローカル登録で続行します');
                    router.push(buildNextUrl(localId));
                } else {
                    setError(`顧客の登録に失敗しました: ${insertError.message}`);
                }
                return;
            }

            if (data) {
                router.push(buildNextUrl(data.id));
            }
        } catch (err) {
            console.error('Error:', err);
            if (ENABLE_LOCAL_FALLBACK) {
                const localId = saveLocalCustomer();
                setError('通信エラーのため、ローカル登録で続行します');
                router.push(buildNextUrl(localId));
            } else {
                setError('通信エラーで登録できませんでした');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="font-bold">新規顧客登録</span>
                <div className="w-10"></div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {/* 基本情報 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">名前 <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="山田 花子"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!e.target.value.trim() && !kanaEdited) {
                                    setKana('');
                                }
                            }}
                            onCompositionUpdate={handleCompositionUpdate}
                            onCompositionEnd={handleCompositionEnd}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="kana">よみがな</Label>
                        <Input
                            id="kana"
                            placeholder="ヤマダ ハナコ"
                            value={kana}
                            onChange={(e) => {
                                setKana(e.target.value);
                                setKanaEdited(true);
                            }}
                        />
                        {!kanaEdited && kana && (
                            <p className="text-xs text-muted-foreground mt-1">名前入力から自動変換されました</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="age">年齢</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="28"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">電話番号</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="090-1234-5678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* お悩み選択 */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-2 border-b">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <span className="font-bold">お悩みを選択</span>
                        {concerns.length > 0 && (
                            <Badge className="bg-primary">{concerns.length}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">任意</span>
                    </div>
                    <div className="p-4">
                        <Tabs defaultValue="damage" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 mb-4">
                                {Object.entries(CONCERN_CATEGORIES).map(([key, { label }]) => (
                                    <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
                                ))}
                            </TabsList>
                            {Object.entries(CONCERN_CATEGORIES).map(([key, { items }]) => (
                                <TabsContent key={key} value={key} className="flex flex-wrap gap-2 mt-0">
                                    {items.map((concern) => (
                                        <button
                                            key={concern}
                                            onClick={() => toggleConcern(concern)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                                concerns.includes(concern)
                                                    ? "bg-primary text-white border-primary shadow-md transform scale-105"
                                                    : "bg-secondary/5 text-foreground border-transparent hover:bg-secondary/10"
                                            )}
                                        >
                                            {concern}
                                        </button>
                                    ))}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>

                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}

                <Button
                    className="w-full h-12 text-lg bg-primary text-white"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            登録中...
                        </>
                    ) : (
                        '登録してカウンセリングへ'
                    )}
                </Button>
            </main>
        </div>
    );
}
