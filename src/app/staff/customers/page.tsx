"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, User, ChevronRight, ChevronLeft, Loader2, X, Calendar, FileText, Sparkles } from 'lucide-react';
import { useCounseling } from '@/context/CounselingContext';
import { Button, Card } from '@/components/ui/common';
import { Customer } from '@/lib/types';

interface PastSession {
  id: string;
  date: string;
  status: string;
  staffName: string;
  hairConditionSummary: string | null;
  treatmentSummary: string | null;
}

export default function CustomerListPage() {
  const router = useRouter();
  const { setCurrentCustomer } = useCounseling();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error('取得に失敗しました');
      setCustomers(await res.json());
    } catch (error) {
      console.error('顧客取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCustomerTap = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
    setShowHistory(false);
    
    if (customer.visitCount > 0) {
      try {
        setLoadingSessions(true);
        const res = await fetch(`/api/customers/${customer.id}/sessions`);
        if (res.ok) setPastSessions(await res.json());
      } catch (error) {
        console.error('セッション取得エラー:', error);
      } finally {
        setLoadingSessions(false);
      }
    } else {
      setPastSessions([]);
    }
  };

  const handleStartNewCounseling = async () => {
    if (!selectedCustomer) return;
    try {
      setCurrentCustomer(selectedCustomer);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomer.id }),
      });
      if (!res.ok) throw new Error('セッション作成に失敗しました');
      const session = await res.json();
      router.push(`/staff/counseling/${session.id}`);
    } catch (error) {
      console.error('セッション作成エラー:', error);
      alert('エラーが発生しました。');
    }
  };

  const handleViewSession = (sessionId: string) => {
    router.push(`/staff/history/${sessionId}`);
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomerName.trim()) { alert('お名前を入力してください'); return; }
    try {
      setCreating(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone || null }),
      });
      if (!res.ok) throw new Error('顧客作成に失敗しました');
      const newCustomer = await res.json();
      setCurrentCustomer(newCustomer);
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: newCustomer.id }),
      });
      if (!sessionRes.ok) throw new Error('セッション作成に失敗しました');
      router.push(`/staff/counseling/${(await sessionRes.json()).id}`);
    } catch (error) {
      console.error('顧客作成エラー:', error);
      alert('エラーが発生しました。');
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setPastSessions([]);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => router.push('/staff')} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-text-secondary">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">顧客選択</h1>
        <div className="w-10" />
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="名前・電話番号で検索" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-surface focus:border-primary outline-none" />
        </div>

        <button onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          className="w-full mb-6 p-4 rounded-xl border-2 border-dashed border-primary/30 text-primary flex items-center justify-center gap-2 hover:bg-primary/5">
          <Plus className="w-5 h-5" /><span className="font-bold">新規顧客を登録</span>
        </button>

        {showNewCustomerForm && (
          <Card className="mb-6">
            <h3 className="font-bold text-text-primary mb-4">新規顧客登録</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">お名前 *</label>
                <input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="山田 花子" className="w-full h-11 px-3 rounded-lg border border-border bg-surface focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">電話番号</label>
                <input type="tel" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="090-1234-5678" className="w-full h-11 px-3 rounded-lg border border-border bg-surface focus:border-primary outline-none" />
              </div>
              <Button onClick={handleCreateNewCustomer} fullWidth disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />作成中...</> : '登録してカウンセリング開始'}
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="font-bold text-text-secondary text-sm">既存のお客様</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <button key={customer.id} onClick={() => handleCustomerTap(customer)}
                className="w-full bg-surface rounded-xl shadow-sm border border-border/50 p-4 flex items-center gap-4 hover:bg-black/[0.02] active:scale-[0.99] text-left">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary truncate">{customer.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {customer.lastVisitDate ? `前回: ${customer.lastVisitDate}` : '初来店'} • {customer.visitCount}回目
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <p>該当するお客様が見つかりません</p>
            </div>
          )}
        </div>
      </main>

      {showModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={closeModal}>
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-text-primary">{selectedCustomer.name}</h2>
                  <p className="text-sm text-text-secondary">来店 {selectedCustomer.visitCount}回</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-black/5">
                <X className="w-6 h-6 text-text-secondary" />
              </button>
            </div>

            {!showHistory ? (
              <div className="space-y-3">
                <button onClick={handleStartNewCounseling}
                  className="w-full p-4 bg-primary text-white rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-primary/90">
                  <Sparkles className="w-5 h-5" />新規カウンセリング開始
                </button>
                {pastSessions.length > 0 && (
                  <button onClick={() => setShowHistory(true)}
                    className="w-full p-4 bg-surface border border-border rounded-xl flex items-center justify-center gap-3 font-bold text-text-primary hover:bg-black/[0.02]">
                    <FileText className="w-5 h-5" />過去の履歴を見る（{pastSessions.length}件）
                  </button>
                )}
                {loadingSessions && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-text-secondary">履歴を読み込み中...</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button onClick={() => setShowHistory(false)} className="flex items-center gap-2 text-primary mb-4">
                  <ChevronLeft className="w-5 h-5" /><span className="font-bold">戻る</span>
                </button>
                <h3 className="font-bold text-text-secondary text-sm mb-3">カウンセリング履歴</h3>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {pastSessions.map((session) => (
                    <button key={session.id} onClick={() => handleViewSession(session.id)}
                      className="w-full p-4 bg-background rounded-xl text-left hover:bg-black/[0.02]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-secondary" />
                          <span className="font-bold text-text-primary">
                            {new Date(session.date).toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric' })}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-secondary" />
                      </div>
                      <p className="text-sm text-text-secondary">{session.hairConditionSummary || '記録なし'}</p>
                      {session.treatmentSummary && <p className="text-sm text-primary mt-1">施術: {session.treatmentSummary}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
