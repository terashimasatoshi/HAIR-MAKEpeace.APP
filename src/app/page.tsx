'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Settings } from "lucide-react";
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useStylist } from '@/contexts/StylistContext';

export default function Home() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const { currentStylist, stylists, isLoading, selectStylist } = useStylist();

  useEffect(() => {
    // Client-side only date formatting to avoid hydration mismatch
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(format(now, "yyyy年M月d日（E）HH:mm", { locale: ja }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

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

        {/* 3. Main Action Cards */}
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
      <footer className="fixed bottom-0 w-full p-4 flex justify-between items-end pointer-events-none">
        <span className="text-xs text-muted-foreground pl-2 pointer-events-auto">v1.0.0</span>
        <Link href="/settings/stylists" className="pointer-events-auto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-transparent hover:text-primary">
            <Settings size={20} />
          </Button>
        </Link>
      </footer>
    </div>
  );
}
