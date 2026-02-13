'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Search, UserPlus, Clock, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { ENABLE_LOCAL_FALLBACK } from "@/lib/runtime-flags";

type Customer = {
    id: string;
    name: string;
    kana: string | null;
    age: number | null;
    created_at: string;
};

type CustomerWithVisits = Customer & {
    lastVisit: string;
    visits: number;
    lastMenu: string;
};

export default function ExistingCustomerPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<CustomerWithVisits[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLocalCustomers = (): CustomerWithVisits[] => {
        if (!ENABLE_LOCAL_FALLBACK) return [];
        const raw = localStorage.getItem('peace_local_customers');
        const localCustomers = raw ? JSON.parse(raw) : [];
        return localCustomers.map((customer: any) => ({
            ...customer,
            visits: 0,
            lastVisit: '初めて',
            lastMenu: 'ローカル',
        }));
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                // 顧客データを取得
                const { data: customersData, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching customers:', error);
                    setCustomers(loadLocalCustomers());
                } else if (customersData && customersData.length > 0) {
                    // 各顧客の来店回数を取得
                    const customersWithVisits = await Promise.all(
                        customersData.map(async (customer) => {
                            const { count } = await supabase
                                .from('visits')
                                .select('*', { count: 'exact', head: true })
                                .eq('customer_id', customer.id);

                            const { data: latestVisit } = await supabase
                                .from('visits')
                                .select('visit_date')
                                .eq('customer_id', customer.id)
                                .order('visit_date', { ascending: false })
                                .limit(1)
                                .maybeSingle();

                            return {
                                ...customer,
                                visits: count || 0,
                                lastVisit: latestVisit ? formatLastVisit(latestVisit.visit_date) : '初めて',
                                lastMenu: '-', // 施術記録から取得する場合は追加実装が必要
                            };
                        })
                    );
                    const localCustomers = loadLocalCustomers();
                    setCustomers([...localCustomers, ...customersWithVisits]);
                } else {
                    setCustomers(loadLocalCustomers());
                }
            } catch (err) {
                console.error('Error:', err);
                setCustomers(loadLocalCustomers());
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const formatLastVisit = (dateStr: string): string => {
        const visitDate = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今日';
        if (diffDays === 1) return '昨日';
        if (diffDays < 7) return `${diffDays}日前`;
        if (diffDays < 14) return '1週間前';
        if (diffDays < 30) return '2週間前';
        if (diffDays < 60) return '1ヶ月前';
        if (diffDays < 90) return '2ヶ月前';
        return '3ヶ月以上前';
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.includes(searchQuery) ||
            (customer.kana && customer.kana.includes(searchQuery));
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* 1. Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="font-bold">顧客選択</span>
                <div className="w-10"></div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">

                {/* 2. Search Section */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="名前、電話番号で検索"
                        className="pl-9 h-11 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* 3. Customer List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-muted-foreground">顧客データを読み込み中...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredCustomers.map((customer) => (
                            <Card
                                key={customer.id}
                                className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] duration-200"
                                onClick={() => router.push(`/customers/${customer.id}/counseling/input`)}
                            >
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{customer.name}</span>
                                            <span className="text-xs text-muted-foreground">{customer.age}歳</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {customer.lastVisit}</span>
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {customer.visits}回</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary" className="text-[10px] font-normal mb-1 block w-fit ml-auto">前回</Badge>
                                        <span className="text-xs font-medium text-primary">{customer.lastMenu}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredCustomers.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>該当する顧客が見つかりません</p>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* 4. New Registration Button */}
            <div className="fixed bottom-0 w-full p-4 bg-white border-t border-border z-20">
                <Button
                    className="w-full text-lg h-12 shadow-md bg-secondary hover:bg-secondary/90 text-white"
                    onClick={() => router.push('/customers/new')}
                >
                    <UserPlus className="mr-2 h-5 w-5" />
                    新規顧客を登録
                </Button>
            </div>

        </div>
    );
}


