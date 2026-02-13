'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Plus, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Stylist = {
    id: string;
    name: string;
    is_active: boolean;
};

export default function StylistManagementPage() {
    const router = useRouter();
    const [stylists, setStylists] = useState<Stylist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const fetchStylists = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('staffs')
            .select('*')
            .order('name', { ascending: true });

        if (data) {
            setStylists(data.map((s: any) => ({ ...s, is_active: s.is_active ?? true })));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStylists();
    }, []);

    const addStylist = async () => {
        if (!newName.trim()) return;
        const { error } = await supabase
            .from('staffs')
            .insert([{ name: newName }]);

        if (!error) {
            setNewName('');
            fetchStylists();
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (typeof currentStatus !== 'boolean') return;
        const { error } = await supabase
            .from('staffs')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (!error) fetchStylists();
    };

    const startEditing = (stylist: Stylist) => {
        setEditingId(stylist.id);
        setEditName(stylist.name);
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        const { error } = await supabase
            .from('staffs')
            .update({ name: editName })
            .eq('id', editingId);

        if (!error) {
            setEditingId(null);
            fetchStylists();
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-bold">スタッフ管理</h1>
            </header>

            <main className="p-4 max-w-md mx-auto space-y-6">

                {/* Add New */}
                <Card>
                    <CardContent className="p-4 flex gap-2">
                        <Input
                            placeholder="新しいスタッフ名"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <Button onClick={addStylist} disabled={!newName.trim()}>
                            <Plus className="h-4 w-4 mr-1" /> 追加
                        </Button>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="space-y-3">
                    {stylists.map(stylist => (
                        <Card key={stylist.id} className={stylist.is_active ? "bg-white" : "bg-gray-50 opacity-80"}>
                            <CardContent className="p-4 flex items-center justify-between">
                                {editingId === stylist.id ? (
                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-8"
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEdit}>
                                            <Save className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold ${!stylist.is_active && "text-muted-foreground line-through"}`}>
                                            {stylist.name}
                                        </span>
                                        {stylist.is_active ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">有効</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">無効</Badge>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={stylist.is_active}
                                        onCheckedChange={() => toggleStatus(stylist.id, stylist.is_active)}
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => startEditing(stylist)}>
                                        <Edit2 className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {stylists.length === 0 && !isLoading && (
                        <p className="text-center text-muted-foreground py-8">スタッフが登録されていません</p>
                    )}
                </div>
            </main>
        </div>
    );
}
