'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ENABLE_LOCAL_FALLBACK } from "@/lib/runtime-flags";

export default function NewCustomerPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [kana, setKana] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const saveLocalCustomer = () => {
        const localId = `local-${Date.now()}`;
        const payload = {
            id: localId,
            name: name.trim(),
            kana: kana.trim() || null,
            age: age ? parseInt(age, 10) : null,
            phone: phone.trim() || null,
            created_at: new Date().toISOString(),
            face_shape: null,
            personal_color: null,
            personal_color_type: null,
            visit_count: 0,
            last_visit_date: null,
        };
        const raw = localStorage.getItem('peace_local_customers');
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem('peace_local_customers', JSON.stringify([payload, ...existing]));
        return localId;
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
                    age: age ? parseInt(age, 10) : null,
                    phone: phone.trim() || null,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                if (ENABLE_LOCAL_FALLBACK) {
                    // Dev fallback
                    const localId = saveLocalCustomer();
                    setError('Supabaseへ保存できないため、ローカル登録で続行します');
                    router.push(`/customers/${localId}/counseling/input`);
                } else {
                    setError(`顧客の登録に失敗しました: ${insertError.message}`);
                }
                return;
            }

            if (data) {
                // 新規作成した顧客IDでカウンセリング画面に遷移
                router.push(`/customers/${data.id}/counseling/input`);
            }
        } catch (err) {
            console.error('Error:', err);
            if (ENABLE_LOCAL_FALLBACK) {
                const localId = saveLocalCustomer();
                setError('通信エラーのため、ローカル登録で続行します');
                router.push(`/customers/${localId}/counseling/input`);
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

            <main className="max-w-md mx-auto p-4 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">名前 <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="山田 花子"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="kana">よみがな</Label>
                        <Input
                            id="kana"
                            placeholder="ヤマダ ハナコ"
                            value={kana}
                            onChange={(e) => setKana(e.target.value)}
                        />
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

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}
                </div>

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
