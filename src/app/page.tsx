'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Settings, PlayCircle, Clock, User } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useStylist } from '@/contexts/StylistContext';
import { supabase } from '@/lib/supabase';

interface PendingSession {
  id: string;
  customerName: string;
  customerId: string;
  selectedMenus: string[];
  createdAt: string;
  stylistName: string | null;
}

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>('');
  const { currentStylist, stylists, isLoading, selectStylist } = useStylist();
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(format(now, "yyyy年M月d日（E）HH:mm", { locale: ja }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 未完了セッション（今日のAI診断済み＋施術記録未完了）を取得
  const fetchPending = useCallback(async () => {
    try {
      // 今日の0時（ローカルタイムゾーン）をUTC ISO文字列に変換
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      // statusフィルタはJS側で行う（.or()構文のPostgREST互換性問題を回避）
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select(`
          id,
          customer_id,
          selected_menus,
          created_at,
          status,
          ai_suggestion,
          customer:customer_id(name),
          stylist:stylist_id(name)
        `)
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Pending sessions error:', error);
        return;
      }

      const filtered = (data || [])
        .filter((s) => {
          // AI診断済み & 未完了のみ
          if (s.ai_suggestion == null) return false;
          const status = (s as Record<string, unknown>).status as string | null;
          return status !== 'completed';
        })
        .map((s) => {
          const rawCustomer = s.customer as unknown;
          const cust = Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer;
          const rawStylist = s.stylist as unknown;
          const sty = Array.isArray(rawStylist) ? rawStylist[0] : rawStylist;
          return {
            id: s.id,
            customerId: s.customer_id,
            customerName: (cust as { name: string } | null)?.name || '不明',
            selectedMenus: (s.selected_menus as string[]) || [],
            createdAt: s.created_at,
            stylistName: (sty as { name: string } | null)?.name || null,
          };
        });

      // 同じ顧客の重複セッションは最新のみ表示（created_at descでソート済み）
      const seen = new Set<string>();
      const sessions = filtered.filter((s) => {
        if (seen.has(s.customerId)) return false;
        seen.add(s.customerId);
        return true;
      });

      setPendingSessions(sessions);
    } catch (err) {
      console.error('Failed to fetch pending sessions:', err);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // 初回 + ページに戻った時に再取得
  useEffect(() => {
    fetchPending();

    // ソフトナビゲーションで戻った場合に再取得
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchPending();
    };
    const handleFocus = () => fetchPending();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPending]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* 1. Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground font-medium">{currentTime}</span>
          <h1 className="text-xl font-bold text-primary tracking-tight">HAIR&MAKE peace</h1>
        </div>

        <div className="w-[180px]">
          <Select defaultValue="takayanagi">
            <SelectTrigger>
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="takayanagi">高柳店</SelectItem>
              <SelectItem value="hanado">花堂店</SelectItem>
              <SelectItem value="morinohibi">森の日々</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">

        {/* 2. Staff Info Card */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Stylist" />
                <AvatarFallback>{currentStylist?.name?.[0] || "ST"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">担当スタイリスト</p>
                <p className="font-bold text-lg">
                  {isLoading ? "..." : (currentStylist?.name || "未選択")}
                </p>
              </div>
            </div>

            {/* Stylist Selection Dropdownload */}
            <div className="flex items-center">
              <Select
                value={currentStylist?.id || ""}
                onValueChange={(val) => selectStylist(val)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="スタッフ変更" />
                </SelectTrigger>
                <SelectContent>
                  {stylists.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 3. Pending Sessions */}
        {!loadingPending && pendingSessions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">施術中のお客様</h2>
              <Badge variant="secondary" className="text-xs">{pendingSessions.length}</Badge>
            </div>
            {pendingSessions.map((session) => {
              const time = session.createdAt
                ? format(new Date(session.createdAt), 'HH:mm', { locale: ja })
                : '';
              return (
                <button
                  key={session.id}
                  onClick={() => router.push(`/customers/${session.customerId}/treatment/record?resume=${session.id}`)}
                  className="w-full text-left"
                >
                  <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{session.customerName} 様</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {time}{session.stylistName ? ` ・ ${session.stylistName}` : ''}
                            {session.selectedMenus.length > 0 && ` ・ ${session.selectedMenus.join(', ')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary flex-shrink-0 ml-2">
                        <PlayCircle size={20} />
                        <span className="text-xs font-bold">再開</span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Main Action Cards */}
        <div className="space-y-6">
          {/* New Customer Card */}
          <Link href="/customers/new" className="block group">
            <Card className="h-[160px] relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-active:scale-[0.98] border-none bg-gradient-to-br from-[#4A7C59]/10 to-[#4A7C59]/5">
              <CardContent className="h-full flex flex-col items-center justify-center text-center p-6 z-10 relative">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <UserPlus size={28} />
                </div>
                <h2 className="text-xl font-bold text-primary mb-1">新規顧客を登録</h2>
                <p className="text-sm text-muted-foreground">初めてのお客様の情報を入力します</p>
              </CardContent>
            </Card>
          </Link>

          {/* Existing Customer Card */}
          <Link href="/customers" className="block group">
            <Card className="h-[160px] relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-active:scale-[0.98] border-none bg-gradient-to-br from-[#8B7355]/10 to-[#8B7355]/5">
              <CardContent className="h-full flex flex-col items-center justify-center text-center p-6 z-10 relative">
                <div className="h-14 w-14 rounded-full bg-secondary/20 flex items-center justify-center mb-4 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                  <Search size={28} />
                </div>
                <h2 className="text-xl font-bold text-secondary mb-1">既存顧客を選択</h2>
                <p className="text-sm text-muted-foreground">お客様を検索してカウンセリング開始</p>
              </CardContent>
            </Card>
          </Link>
        </div>

      </main>

      {/* 5. Footer */}
      <footer className="fixed bottom-0 w-full p-4 pb-safe flex justify-between items-end pointer-events-none">
        <span className="text-xs text-muted-foreground pl-2 pointer-events-auto">v2.3.0</span>
        <Link href="/settings/stylists" className="pointer-events-auto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-transparent hover:text-primary">
            <Settings size={20} />
          </Button>
        </Link>
      </footer>
    </div>
  );
}
