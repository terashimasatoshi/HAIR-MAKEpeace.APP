'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { ENABLE_LOCAL_FALLBACK } from '@/lib/runtime-flags';

type Stylist = {
    id: string;
    name: string;
    is_active?: boolean;
};

type StylistContextType = {
    currentStylist: Stylist | null;
    stylists: Stylist[];
    isLoading: boolean;
    selectStylist: (id: string) => void;
};

const StylistContext = createContext<StylistContextType | undefined>(undefined);

const FALLBACK_STYLISTS: Stylist[] = [
    { id: 'local-stylist-1', name: '担当A', is_active: true },
    { id: 'local-stylist-2', name: '担当B', is_active: true },
    { id: 'local-stylist-3', name: '担当C', is_active: true },
];

export function StylistProvider({ children }: { children: ReactNode }) {
    const [currentStylist, setCurrentStylist] = useState<Stylist | null>(null);
    const [stylists, setStylists] = useState<Stylist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStylists = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('stylists')
            .select('id, name')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        const normalizedStylists = (data || []).map((s: any) => ({ ...s, is_active: true }));
        const effectiveStylists = (!error && normalizedStylists.length > 0)
            ? normalizedStylists
            : (ENABLE_LOCAL_FALLBACK ? FALLBACK_STYLISTS : []);

        if (error && ENABLE_LOCAL_FALLBACK) {
            console.error('Failed to fetch stylists, using fallback:', error);
        }

        setStylists(effectiveStylists);

        // Restore from localStorage or default to first
        const savedId = localStorage.getItem('peace_stylist_id');
        if (savedId) {
            const saved = effectiveStylists.find(s => s.id === savedId);
            if (saved) {
                setCurrentStylist(saved);
            } else if (effectiveStylists.length > 0) {
                setCurrentStylist(effectiveStylists[0]);
            }
        } else if (effectiveStylists.length > 0) {
            setCurrentStylist(effectiveStylists[0]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStylists();
    }, []);

    const selectStylist = (id: string) => {
        const stylist = stylists.find(s => s.id === id);
        if (stylist) {
            setCurrentStylist(stylist);
            localStorage.setItem('peace_stylist_id', id);
        }
    };

    return (
        <StylistContext.Provider value={{ currentStylist, stylists, isLoading, selectStylist }}>
            {children}
        </StylistContext.Provider>
    );
}

export function useStylist() {
    const context = useContext(StylistContext);
    if (context === undefined) {
        throw new Error('useStylist must be used within a StylistProvider');
    }
    return context;
}
