'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useStylist } from '@/contexts/StylistContext';
import { ENABLE_LOCAL_FALLBACK } from '@/lib/runtime-flags';

type PersonalColor = {
    base: 'warm' | 'cool';
    season: string;
} | null;

type Customer = {
    id: string;
    name: string;
    kana?: string;
    age?: number;
    phone?: string;
    face_shape?: string | null;
    personal_color?: string | null;
    personal_color_type?: 'yellowbase' | 'bluebase' | 'warm' | 'cool' | null;
    last_visit_date?: string | null;
    visit_count?: number;
};

type CounselingData = {
    concerns: string[];
    damageLevel: number;
    faceShape: string;
    personalColor: PersonalColor;
    selectedMenus: string[];
    request: string;
    stylistId: string | null;
};

type CounselingContextType = {
    customer: Customer | null;
    stylist: { id: string; name: string } | null;
    data: CounselingData;
    isLoadingCustomer: boolean;
    updateData: (updates: Partial<CounselingData>) => void;
    saveToSupabase: (customerId: string, aiSuggestion?: object) => Promise<{ visitId: string | null; sessionId: string | null }>;
    saveTreatment: (custId: string, treatmentData: any) => Promise<boolean>;
    resetData: () => void;
};

const CounselingContext = createContext<CounselingContextType | undefined>(undefined);

const initialData: CounselingData = {
    concerns: [],
    damageLevel: 1,
    faceShape: '',
    personalColor: null,
    selectedMenus: [],
    request: '',
    stylistId: null,
};

export function CounselingProvider({ children, customerId }: { children: ReactNode; customerId?: string }) {
    const { currentStylist } = useStylist();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [stylist, setStylist] = useState<{ id: string; name: string } | null>(null);
    const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

    // Initialize with global stylist if available
    const [data, setData] = useState<CounselingData>({
        ...initialData,
        stylistId: currentStylist?.id || null
    });

    // Update local stylistId if global changes (optional, but keep in sync initially)
    useEffect(() => {
        if (currentStylist?.id && !data.stylistId) {
            updateData({ stylistId: currentStylist.id });
        }
    }, [currentStylist]);

    useEffect(() => {
        if (!customerId) return;
        const fetchCustomer = async () => {
            setIsLoadingCustomer(true);
            try {
                // Local fallback customer (when Supabase write is unavailable)
                if (ENABLE_LOCAL_FALLBACK && customerId.startsWith('local-')) {
                    const raw = localStorage.getItem('peace_local_customers');
                    const locals = raw ? JSON.parse(raw) : [];
                    const localCustomer = locals.find((c: any) => c.id === customerId);
                    if (localCustomer) {
                        setCustomer(localCustomer);
                        return;
                    }
                }

                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', customerId)
                    .single();

                if (error) throw error;
                if (data) {
                    setCustomer(data);
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
                setCustomer(null);
            } finally {
                setIsLoadingCustomer(false);
            }
        };
        fetchCustomer();
    }, [customerId]);

    // Fetch Stylist when ID changes
    useEffect(() => {
        if (!data.stylistId) {
            setStylist(null);
            return;
        }
        const fetchStylist = async () => {
            const { data: sData } = await supabase
                .from('staffs')
                .select('id, name')
                .eq('id', data.stylistId)
                .single();
            if (sData) setStylist(sData);
        };
        fetchStylist();
    }, [data.stylistId]);

    const updateData = (updates: Partial<CounselingData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const resetData = () => {
        setData(initialData);
    };

    const [visitId, setVisitId] = useState<string | null>(null);
    const [counselingSessionId, setCounselingSessionId] = useState<string | null>(null);

    const persistDiagnosisCache = (custId: string) => {
        if (!ENABLE_LOCAL_FALLBACK) return;
        const raw = localStorage.getItem('peace_diagnosis_cache');
        const cache = raw ? JSON.parse(raw) : {};
        cache[custId] = {
            face_shape: data.faceShape || null,
            personal_color: data.personalColor?.season || null,
            personal_color_type: data.personalColor?.base
                ? (data.personalColor.base === 'warm' ? 'yellowbase' : 'bluebase')
                : null,
            updated_at: new Date().toISOString(),
        };
        localStorage.setItem('peace_diagnosis_cache', JSON.stringify(cache));
    };

    const updateLocalCustomerDiagnosis = (custId: string) => {
        if (!ENABLE_LOCAL_FALLBACK) return;
        const raw = localStorage.getItem('peace_local_customers');
        const locals = raw ? JSON.parse(raw) : [];
        const idx = locals.findIndex((c: any) => c.id === custId);
        if (idx === -1) return;

        const nextVisitCount = (locals[idx].visit_count || 0) + 1;
        const updates = {
            face_shape: data.faceShape || null,
            personal_color: data.personalColor?.season || null,
            personal_color_type: data.personalColor?.base
                ? (data.personalColor.base === 'warm' ? 'yellowbase' : 'bluebase')
                : null as Customer['personal_color_type'],
            last_visit_date: new Date().toISOString().split('T')[0],
            visit_count: nextVisitCount,
        };

        locals[idx] = { ...locals[idx], ...updates };
        localStorage.setItem('peace_local_customers', JSON.stringify(locals));
        setCustomer(prev => prev ? ({ ...prev, ...updates }) : prev);
    };

    // ... existing saveToSupabase ...
    const saveToSupabase = async (custId: string, aiSuggestion?: object): Promise<{ visitId: string | null; sessionId: string | null }> => {
        try {
            // Always persist diagnosis cache for flow branching (even if Supabase fails)
            persistDiagnosisCache(custId);

            // Local-only customer flow fallback
            if (ENABLE_LOCAL_FALLBACK && custId.startsWith('local-')) {
                updateLocalCustomerDiagnosis(custId);
                return { visitId: null, sessionId: null };
            }

            const defaultStoreId = 'd7f4bd2c-69a2-4caf-a717-4a70615b47e6';
            const defaultStaffId = '3a71d761-c4da-4eef-b938-a383a576ec13';
            const normalizedColorBase = data.personalColor?.base
                ? (data.personalColor.base === 'warm' ? 'yellowbase' : 'bluebase')
                : null;

            // 1. Create Counseling Session (actual schema)
            const { data: session, error: sessionError } = await supabase
                .from('counseling_sessions')
                .insert({
                    customer_id: custId,
                    staff_id: data.stylistId || defaultStaffId,
                    store_id: defaultStoreId,
                    session_date: new Date().toISOString().split('T')[0],
                    status: 'draft',
                    assessment: {
                        concerns: data.concerns,
                        damageLevel: data.damageLevel,
                        faceShape: data.faceShape || null,
                        personalColor: {
                            base: data.personalColor?.base || null,
                            season: data.personalColor?.season || null,
                            type: normalizedColorBase,
                        },
                        request: data.request || '',
                        selectedMenus: data.selectedMenus || [],
                    },
                    treatment_plan: aiSuggestion ? { aiSuggestion } : null,
                })
                .select()
                .single();

            if (sessionError) {
                console.error('Session insert error:', sessionError);
                if (ENABLE_LOCAL_FALLBACK) updateLocalCustomerDiagnosis(custId);
                return { visitId: null, sessionId: null };
            }

            // 2. Keep latest diagnosis on customers table for next visits
            const newVisitCount = ((customer?.visit_count as number) || 0) + 1;
            const customerUpdatePayload = {
                face_shape: data.faceShape || null,
                personal_color: data.personalColor?.season || null,
                personal_color_type: data.personalColor?.base
                    ? (data.personalColor.base === 'warm' ? 'yellowbase' : 'bluebase')
                    : null as Customer['personal_color_type'],
                last_visit_date: new Date().toISOString().split('T')[0],
                visit_count: newVisitCount,
            };

            const { error: customerUpdateError } = await supabase
                .from('customers')
                .update(customerUpdatePayload)
                .eq('id', custId);

            if (customerUpdateError) {
                console.error('Customer update error:', customerUpdateError);
                if (ENABLE_LOCAL_FALLBACK) updateLocalCustomerDiagnosis(custId);
            }

            setCounselingSessionId(session.id);
            setCustomer(prev => prev ? ({ ...prev, ...customerUpdatePayload }) : prev);

            return { visitId: null, sessionId: session.id };
        } catch (err) {
            console.error('Error saving to Supabase:', err);
            return { visitId: null, sessionId: null };
        }
    };

    const saveTreatment = async (
        custId: string,
        treatmentData: {
            selectedProducts: string[],
            finishDamageLevel: number,
            notes: string
        }
    ) => {
        let currentVisitId = visitId;

        // If visitId is missing (e.g. page reload), try to find or create one
        if (!currentVisitId) {
            console.log("Visit ID missing, attempting recovery...");
            const today = new Date().toISOString().split('T')[0];

            // 1. Try to find existing visit for today
            const { data: existingVisit } = await supabase
                .from('visits')
                .select('id')
                .eq('customer_id', custId)
                .eq('visit_date', today)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingVisit) {
                console.log("Recovered existing visit ID:", existingVisit.id);
                currentVisitId = existingVisit.id;
                setVisitId(existingVisit.id);
            } else {
                // 2. Create new visit if none found
                console.log("No existing visit found, creating new one...");
                const { data: newVisit, error: createError } = await supabase
                    .from('visits')
                    .insert({
                        customer_id: custId,
                        visit_date: today,
                    })
                    .select()
                    .single();

                if (createError || !newVisit) {
                    console.error("Failed to create visit for treatment save:", createError);
                    return false;
                }
                currentVisitId = newVisit.id;
                setVisitId(newVisit.id);
            }
        }

        if (!currentVisitId) return false;

        const { error } = await supabase
            .from('treatment_records')
            .insert({
                visit_id: currentVisitId,
                customer_id: custId,
                selected_products: treatmentData.selectedProducts,
                finish_damage_level: treatmentData.finishDamageLevel,
                notes: treatmentData.notes,
            });

        if (error) {
            console.error("Treatment save error:", error);
            // If error is duplicate key (unique constraint on visit_id), try updating instead
            if (error.code === '23505') {
                console.log("Record exists, attempting update...");
                const { error: updateError } = await supabase
                    .from('treatment_records')
                    .update({
                        selected_products: treatmentData.selectedProducts,
                        finish_damage_level: treatmentData.finishDamageLevel,
                        notes: treatmentData.notes,
                    })
                    .eq('visit_id', currentVisitId);

                if (updateError) {
                    console.error("Update failed:", updateError);
                    return false;
                }
                return true;
            }
            return false;
        }
        return true;
    };

    return (
        <CounselingContext.Provider value={{ customer, stylist, data, isLoadingCustomer, updateData, saveToSupabase, saveTreatment, resetData }}>
            {children}
        </CounselingContext.Provider>
    );
}

export function useCounseling() {
    const context = useContext(CounselingContext);
    if (context === undefined) {
        throw new Error('useCounseling must be used within a CounselingProvider');
    }
    return context;
}

