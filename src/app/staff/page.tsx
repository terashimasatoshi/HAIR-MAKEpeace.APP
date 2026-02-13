import Link from 'next/link';
import { Users, Plus, Clock } from 'lucide-react';

export default function StaffDashboard() {
  return (
    <div className="container mx-auto p-4 max-w-lg">
      {/* Header */}
      <header className="mb-8 pt-4">
        <h1 className="text-2xl font-bold text-primary">
          HAIR&MAKE peace
        </h1>
        <p className="text-text-secondary">カウンセリングシステム</p>
      </header>

      {/* Main Actions */}
      <div className="space-y-4">
        {/* 新規カウンセリング */}
        <Link href="/staff/customers">
          <div className="bg-surface rounded-xl shadow-sm border border-border/50 p-5 cursor-pointer active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Plus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">新規カウンセリング</h2>
                <p className="text-sm text-text-secondary">
                  お客様を選択してカウンセリングを開始
                </p>
              </div>
            </div>
          </div>
        </Link>

        {/* 継続中のセッション（後で実装） */}
        <div className="bg-surface rounded-xl shadow-sm border border-border/50 p-5 opacity-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">継続中のセッション</h2>
              <p className="text-sm text-text-secondary">
                まだセッションはありません
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-text-secondary text-sm">
        <p>ver 1.0.0</p>
      </div>
    </div>
  );
}
