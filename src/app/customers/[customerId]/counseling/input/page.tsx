'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Info, User, Smile, Palette, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCounseling } from "@/contexts/CounselingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PreviousDiagnosisCard } from "@/components/counseling/PreviousDiagnosisCard";
import { ENABLE_LOCAL_FALLBACK } from "@/lib/runtime-flags";

// Mock Data
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

const FACE_SHAPES = [
    { id: "egg", label: "卵型" },
    { id: "round", label: "丸型" },
    { id: "long", label: "面長" },
    { id: "base", label: "ベース型" },
    { id: "triangle", label: "逆三角形" }
];

const NEW_CUSTOMER_STEPS = [
    { id: 'concerns', label: '悩み' },
    { id: 'damage', label: 'ダメージ' },
    { id: 'faceShape', label: '顔型' },
    { id: 'personalColor', label: 'パーソナルカラー' },
    { id: 'menu', label: 'メニュー' },
    { id: 'aiSuggestion', label: 'AI提案' },
];

const EXISTING_CUSTOMER_STEPS = [
    { id: 'concerns', label: '悩み' },
    { id: 'damage', label: 'ダメージ' },
    { id: 'menu', label: 'メニュー' },
    { id: 'aiSuggestion', label: 'AI提案' },
];

const mapCustomerFaceShapeToForm = (faceShape?: string | null) => {
    const map: Record<string, string> = {
        oval: "egg",
        round: "round",
        square: "base",
        heart: "triangle",
        oblong: "long",
        egg: "egg",
        base: "base",
        triangle: "triangle",
        long: "long",
    };
    return faceShape ? map[faceShape] || faceShape : "";
};

const mapCustomerPersonalColorTypeToForm = (personalColorType?: string | null): "warm" | "cool" | null => {
    if (!personalColorType) return null;
    if (personalColorType === "yellowbase" || personalColorType === "warm") return "warm";
    if (personalColorType === "bluebase" || personalColorType === "cool") return "cool";
    return null;
};

export default function CounselingInputPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.customerId as string;

    const { data, updateData, customer, isLoadingCustomer } = useCounseling();
    const [stylists, setStylists] = useState<{ id: string; name: string }[]>([]);

    // New State for History
    const [visitCount, setVisitCount] = useState<number | null>(null);
    const [prevRecord, setPrevRecord] = useState<any>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showFullPrevAiSuggestion, setShowFullPrevAiSuggestion] = useState(false);
    const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
    const [storedDiagnosis, setStoredDiagnosis] = useState<{
        faceShape: string | null;
        personalColor: string | null;
        personalColorType: string | null;
    }>({
        faceShape: null,
        personalColor: null,
        personalColorType: null,
    });
    const hasAppliedPreset = useRef(false);

    useEffect(() => {
        const fetchStylists = async () => {
            const { data } = await supabase
                .from('staffs')
                .select('id, name')
                .order('name', { ascending: true });
            if (data && data.length > 0) {
                setStylists(data);
            } else if (ENABLE_LOCAL_FALLBACK) {
                setStylists([
                    { id: 'local-stylist-1', name: '担当A' },
                    { id: 'local-stylist-2', name: '担当B' },
                    { id: 'local-stylist-3', name: '担当C' },
                ]);
            } else {
                setStylists([]);
            }
        };

        const fetchVisitCount = async () => {
            if (ENABLE_LOCAL_FALLBACK && customerId.startsWith('local-')) {
                const raw = localStorage.getItem('peace_local_customers');
                const locals = raw ? JSON.parse(raw) : [];
                const localCustomer = locals.find((c: any) => c.id === customerId);
                setVisitCount(localCustomer?.visit_count || 0);
                return;
            }

            const { data: customerRow, error } = await supabase
                .from('customers')
                .select('visit_count')
                .eq('id', customerId)
                .maybeSingle();

            if (!error && customerRow) {
                setVisitCount(customerRow.visit_count || 0);
            } else {
                console.error("Error fetching visit count:", error);
                setVisitCount(((customer as any)?.visit_count as number) || 0);
            }
        };

        fetchStylists();
        fetchVisitCount();
    }, [customerId]);

    const fetchPreviousRecord = async () => {
        setIsLoadingHistory(true);
        setShowFullPrevAiSuggestion(false);
        try {
            // 1. Get the most recent counseling session
            const { data: counselingSession, error: csError } = await supabase
                .from('counseling_sessions')
                .select('id, session_date, created_at, assessment, treatment_plan')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (csError || !counselingSession) {
                console.log("No previous counseling session found or error:", csError);
                setPrevRecord(null);
                return;
            }

            // 2. Get latest treatment record by customer_id
            const { data: treatmentRecord, error: trError } = await supabase
                .from('treatment_records')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            console.log("Treatment record by customer_id:", treatmentRecord, trError);

            // Combine into the expected structure
            setPrevRecord({
                visit_date: counselingSession.session_date || counselingSession.created_at?.split('T')?.[0] || '',
                counseling_sessions: counselingSession ? [counselingSession] : [],
                treatment_records: treatmentRecord ? [treatmentRecord] : []
            });

        } catch (err) {
            console.error("Error loading history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // ... existing helpers ...
    const { concerns: selectedConcerns, damageLevel, personalColor, faceShape, request } = data;
    const personalColorBase = personalColor?.base || null;
    const personalColorSeason = personalColor?.season || "";
    // Re-declare existing helpers to match file context if needed, but since we modify component body:

    const toggleConcern = (concern: string) => {
        const newConcerns = selectedConcerns.includes(concern)
            ? selectedConcerns.filter(c => c !== concern)
            : [...selectedConcerns, concern];
        updateData({ concerns: newConcerns });
    };

    const setDamageLevel = (level: number) => updateData({ damageLevel: level });
    const setFaceShape = (shape: string) => updateData({ faceShape: shape });
    const setPersonalColorBase = (base: "warm" | "cool") => {
        updateData({ personalColor: { base, season: "" } });
    };
    const setPersonalColorSeason = (season: string) => {
        if (personalColorBase) {
            updateData({ personalColor: { base: personalColorBase, season } });
        }
    };
    const setRequest = (req: string) => updateData({ request: req });

    useEffect(() => {
        hasAppliedPreset.current = false;
        setIsEditingDiagnosis(false);
    }, [customerId]);

    // 0) ローカル診断キャッシュ（Supabase保存不可時の引き継ぎ）
    useEffect(() => {
        if (!ENABLE_LOCAL_FALLBACK) return;
        if (!customerId) return;
        const raw = localStorage.getItem('peace_diagnosis_cache');
        const cache = raw ? JSON.parse(raw) : {};
        const cached = cache[customerId];
        if (!cached) return;

        setStoredDiagnosis(prev => ({
            faceShape: prev.faceShape || cached.face_shape || null,
            personalColor: prev.personalColor || cached.personal_color || null,
            personalColorType: prev.personalColorType || cached.personal_color_type || null,
        }));
    }, [customerId]);

    // 1) customersテーブル値を優先取り込み
    useEffect(() => {
        if (!customer) return;
        setStoredDiagnosis(prev => ({
            faceShape: (customer as any)?.face_shape ?? prev.faceShape,
            personalColor: (customer as any)?.personal_color ?? prev.personalColor,
            personalColorType: (customer as any)?.personal_color_type ?? prev.personalColorType,
        }));
    }, [customer]);

    // 2) customersに無い場合は直近counseling_sessionsから補完
    useEffect(() => {
        const fillFromLatestSession = async () => {
            if (!customerId || (ENABLE_LOCAL_FALLBACK && customerId.startsWith('local-'))) return;
            if (storedDiagnosis.faceShape && storedDiagnosis.personalColor && storedDiagnosis.personalColorType) return;

            const { data: latestSession, error } = await supabase
                .from('counseling_sessions')
                .select('assessment')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error || !latestSession) return;

            const assessment = latestSession.assessment || {};
            const faceShape = assessment.faceShape || null;
            const season = assessment.personalColor?.season || null;
            const rawType = assessment.personalColor?.type || assessment.personalColor?.base || null;

            const mappedType =
                rawType === 'warm' ? 'yellowbase'
                    : rawType === 'cool' ? 'bluebase'
                        : rawType;

            setStoredDiagnosis(prev => ({
                faceShape: prev.faceShape || faceShape,
                personalColor: prev.personalColor || season,
                personalColorType: prev.personalColorType || mappedType || null,
            }));
        };

        fillFromLatestSession();
    }, [customerId, storedDiagnosis.faceShape, storedDiagnosis.personalColor, storedDiagnosis.personalColorType]);

    const customerFaceShape = storedDiagnosis.faceShape;
    const customerPersonalColor = storedDiagnosis.personalColor;
    const customerPersonalColorType = storedDiagnosis.personalColorType;
    const hasStoredDiagnosis = Boolean(customerFaceShape && customerPersonalColor && customerPersonalColorType);
    const isNewFlow = !hasStoredDiagnosis;
    const steps = (isNewFlow || isEditingDiagnosis) ? NEW_CUSTOMER_STEPS : EXISTING_CUSTOMER_STEPS;
    const showDiagnosisInputs = isNewFlow || isEditingDiagnosis;

    useEffect(() => {
        if (!customer || isNewFlow || hasAppliedPreset.current) return;

        const mappedFaceShape = mapCustomerFaceShapeToForm(customerFaceShape);
        const mappedColorBase = mapCustomerPersonalColorTypeToForm(customerPersonalColorType);
        const mappedColorSeason = customerPersonalColor || "";

        const shouldUpdateFaceShape = mappedFaceShape && data.faceShape !== mappedFaceShape;
        const shouldUpdatePersonalColor =
            mappedColorBase &&
            (data.personalColor?.base !== mappedColorBase || data.personalColor?.season !== mappedColorSeason);

        if (shouldUpdateFaceShape || shouldUpdatePersonalColor) {
            updateData({
                ...(shouldUpdateFaceShape ? { faceShape: mappedFaceShape } : {}),
                ...(shouldUpdatePersonalColor
                    ? { personalColor: { base: mappedColorBase, season: mappedColorSeason } }
                    : {}),
            });
        }

        hasAppliedPreset.current = true;
    }, [
        customer,
        isNewFlow,
        customerFaceShape,
        customerPersonalColor,
        customerPersonalColorType,
        data.faceShape,
        data.personalColor,
        updateData,
    ]);

    const getDamageColor = (level: number) => {
        if (level <= 1) return "bg-[#4A7C59]"; // Green
        if (level <= 3) return "bg-[#E3B23C]"; // Yellow
        return "bg-[#D87B5A]"; // Red
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* 1. Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground font-medium">カウンセリング</p>
                    <h1 className="text-lg font-bold">
                        {isLoadingCustomer ? (
                            <span className="opacity-50">読み込み中...</span>
                        ) : (
                            customer?.name || "ゲスト様"
                        )}
                        {customer && " 様"}
                    </h1>
                    {/* Stylist Display */}
                    <p className="text-xs text-primary font-medium mt-0.5">
                        担当: {data.stylistId ? (stylists.find(s => s.id === data.stylistId)?.name || "...") : "未選択"}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customerId}/counseling/menu`)}>
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">

                {/* 2. Customer Info Summary */}
                <Card className="bg-primary/5 border-none">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {isLoadingCustomer ? (
                                    <Badge variant="outline" className="bg-white text-gray-300 border-gray-200">...</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-white text-primary border-primary">
                                        {customer?.age ? `${customer.age}歳` : "年齢未登録"}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="bg-white text-primary border-primary">
                                    {(visitCount !== null) ? `${visitCount + 1}回目` : "..."}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {(visitCount === 0) ? "初回カウンセリング" : "前回データを確認してください"}
                            </p>
                        </div>

                        {/* Previous Record Dialog */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={fetchPreviousRecord}
                                    disabled={visitCount === 0}
                                >
                                    <Info className="mr-1 h-3 w-3" />
                                    前回の記録
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>前回の記録</DialogTitle>
                                </DialogHeader>
                                {isLoadingHistory ? (
                                    <div className="p-4 text-center">読み込み中...</div>
                                ) : prevRecord ? (
                                    <div className="space-y-4 text-sm">
                                        {/* 1. Date */}
                                        <div className="bg-muted p-2 rounded flex justify-between items-center">
                                            <span className="font-bold">来店日</span>
                                            <span>{prevRecord.visit_date}</span>
                                        </div>

                                        {(() => {
                                            const cs = prevRecord.counseling_sessions?.[0];
                                            const tr = prevRecord.treatment_records?.[0];
                                            const assessment = cs?.assessment || {};

                                            // Helper to get menu name (Simplified mapping for display)
                                            const getMenuName = (id: string) => {
                                                const menuMap: { [key: string]: string } = {
                                                    'cut-1': 'カット', 'cut-2': '大学生デザインカット', 'cut-3': 'スクールカット', 'cut-4': 'チャイルドカット(小)', 'cut-5': 'チャイルドカット(未)', 'cut-6': '前髪カット',
                                                    'col-1': 'オーガニックカラー', 'col-2': 'オーガニックカラー(ハーブOX)', 'col-3': 'ケアブリーチ', 'col-4': 'メテオカラー', 'col-5': 'マニキュア', 'col-6': 'ハイライト/インナー(単)', 'col-7': 'ハイライト/インナー(追)',
                                                    'perm-1': 'オーガニックパーマ', 'perm-2': ' ポイントパーマ',
                                                    'str-1': 'メテオストレート', 'str-2': '学割U18ストレート', 'str-3': 'メテオ前髪ストレート', 'str-4': '前髪ストレート',
                                                    'tr-1': 'ヒーリングTr(単)', 'tr-2': 'ヒーリングTr(組)', 'tr-3': 'ローズスパ(単)', 'tr-4': 'ローズスパ(組)', 'tr-5': 'シェルパTr', 'tr-6': '水素Tr',
                                                    'set-1': 'アップ', 'set-2': 'ハーフアップ', 'set-3': 'ダウン',
                                                    'spa-1': 'ヘッドスパ(組)', 'spa-2': 'ヘッドスパ(単)', 'spa-3': '頭浸浴(組)', 'spa-4': '頭浸浴(単)',
                                                    'other-1': 'アロマシャンプー', 'other-2': '着付け', 'other-3': 'お直し'
                                                };
                                                return menuMap[id] || id;
                                            };

                                            const getProductName = (id: string) => {
                                                // Simplified Product Map (Populate common ones, fallback to ID)
                                                const productMap: { [key: string]: string } = {
                                                    'h1': 'ピンクH (P/h)', 'h2': 'オレンジH (O/h)', 'h3': 'マットH (M/h)', 'h4': 'アッシュH (A/h)', 'h5': 'ブラウンH (B/h)',
                                                    'v1': 'バイオレットV (V/v)', 'v2': 'ピンクV (P/v)', 'v3': 'ガーネットレッドV (GR/v)', 'v4': 'レッドV (R/v)', 'v5': 'オレンジV (O/v)',
                                                    's1': 'NEO METEO クリーム ph10.5', 's2': 'NEO METEO クリーム ph7.0',
                                                    't1': 'インカラミ 1', 't2': 'インカラミ 2', 't3': 'インカラミ 3',
                                                };
                                                return productMap[id] || id;
                                            };

                                            return (
                                                <>
                                                    {/* 2. Menus */}
                                                    {cs && (
                                                        <div className="border-b pb-2">
                                                            <p className="font-bold mb-1 text-xs text-muted-foreground">メニュー</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {assessment.selectedMenus?.length > 0 ? (
                                                                    assessment.selectedMenus.map((m: string) => (
                                                                        <Badge key={m} variant="secondary" className="text-xs">{getMenuName(m)}</Badge>
                                                                    ))
                                                                ) : <span className="text-muted-foreground text-xs">なし</span>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 3. Concerns */}
                                                    {cs && (
                                                        <div className="border-b pb-2">
                                                            <p className="font-bold mb-1 text-xs text-muted-foreground">お悩み</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(assessment.concerns || []).map((c: string) => (
                                                                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 4. Finish Damage Level */}
                                                    <div className="border-b pb-2">
                                                        <p className="font-bold mb-1 text-xs text-muted-foreground">仕上がりダメージ</p>
                                                        {tr ? (
                                                            <Badge className={cn("text-white border-none", getDamageColor(tr.finish_damage_level || 0))}>
                                                                Lv.{tr.finish_damage_level}
                                                            </Badge>
                                                        ) : <span className="text-xs text-muted-foreground">未記録</span>}
                                                    </div>

                                                    {/* 5-6. Face & Color */}
                                                    {cs && (
                                                        <div className="border-b pb-2 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <p className="font-bold mb-1 text-xs text-muted-foreground">顔型</p>
                                                                <span className="text-sm">{FACE_SHAPES.find(f => f.id === assessment.faceShape)?.label || assessment.faceShape || "未設定"}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold mb-1 text-xs text-muted-foreground">パーソナルカラー</p>
                                                                <span className="text-sm">
                                                                    {assessment.personalColor?.base === 'warm' ? 'イエベ' : assessment.personalColor?.base === 'cool' ? 'ブルベ' : '未設定'}
                                                                    {assessment.personalColor?.season && ` / ${assessment.personalColor.season}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 7. Treatment Products */}
                                                    {tr ? (
                                                        <div className="bg-primary/5 p-3 rounded border border-primary/10">
                                                            <p className="font-bold mb-2 text-primary flex items-center gap-2">
                                                                <Info className="w-4 h-4" />
                                                                使用薬剤
                                                            </p>
                                                            <div className="space-y-2">
                                                                {tr.selected_products && tr.selected_products.length > 0 ? (
                                                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                                                        {tr.selected_products.map((p: string, i: number) => (
                                                                            <li key={i}>{getProductName(p)}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-muted-foreground text-xs">薬剤記録なし</p>
                                                                )}

                                                                {tr.notes && (
                                                                    <div className="mt-2 pt-2 border-t border-primary/10">
                                                                        <p className="font-bold text-xs text-muted-foreground">施術メモ</p>
                                                                        <p className="text-sm mt-1">{tr.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-muted p-2 rounded text-center text-muted-foreground text-xs">
                                                            施術記録なし
                                                        </div>
                                                    )}

                                                    {/* 8. Request */}
                                                    {cs && (
                                                        <div className="border-b pb-2 pt-2">
                                                            <p className="font-bold mb-1 text-xs text-muted-foreground">ご要望</p>
                                                            <p className="text-sm">{assessment.request || "なし"}</p>
                                                        </div>
                                                    )}

                                                    {/* 9. AI Suggestion */}
                                                    {(cs?.treatment_plan?.aiSuggestion || assessment?.aiSuggestion) && (
                                                        <div className="pt-2">
                                                            <p className="font-bold mb-1 text-xs text-muted-foreground">AI提案（概要）</p>
                                                            {(() => {
                                                                const aiSuggestionText =
                                                                    typeof (cs.treatment_plan?.aiSuggestion || assessment.aiSuggestion) === 'string'
                                                                        ? (cs.treatment_plan?.aiSuggestion || assessment.aiSuggestion)
                                                                        : ((cs.treatment_plan?.aiSuggestion || assessment.aiSuggestion)?.aiAnalysis || "提案あり");
                                                                const canExpand = aiSuggestionText.length > 100;
                                                                const displayedText = showFullPrevAiSuggestion || !canExpand
                                                                    ? aiSuggestionText
                                                                    : `${aiSuggestionText.substring(0, 100)}...`;

                                                                return (
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                                                            {displayedText}
                                                                        </p>
                                                                        {canExpand && (
                                                                            <button
                                                                                type="button"
                                                                                className="text-xs font-medium text-primary hover:underline"
                                                                                onClick={() => setShowFullPrevAiSuggestion(prev => !prev)}
                                                                            >
                                                                                {showFullPrevAiSuggestion ? "折りたたむ" : "全文を表示"}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground">
                                        前回の記録が見つかりませんでした。
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Counseling Step Indicator (new/existing dynamic) */}
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2">カウンセリングステップ</p>
                        <div className={cn("grid gap-2", steps.length === 6 ? "grid-cols-3" : "grid-cols-4")}>
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className="text-[11px] text-center py-1 rounded-full bg-primary/10 text-primary font-medium"
                                >
                                    {step.label}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Previous diagnosis card for existing customer flow */}
                {!isNewFlow && !isEditingDiagnosis && customer && (
                    <PreviousDiagnosisCard
                        customer={{
                            face_shape: customerFaceShape,
                            personal_color: customerPersonalColor,
                            personal_color_type: customerPersonalColorType,
                        }}
                        onEdit={() => setIsEditingDiagnosis(true)}
                    />
                )}

                {/* 3. Stylist Select */}
                <div className="space-y-2">
                    <Label>担当スタイリスト</Label>
                    <Select
                        value={data.stylistId || ""}
                        onValueChange={(val) => updateData({ stylistId: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="担当スタイリストを選択" />
                        </SelectTrigger>
                        <SelectContent>
                            {stylists.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 4. Concerns */}
                <Accordion type="single" collapsible defaultValue="concerns" className="w-full">
                    {/* ... Rest of Accordion ... */}
                    <AccordionItem value="concerns" className="border-none bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-primary" />
                                <span className="font-bold">お悩みを選択</span>
                                {selectedConcerns.length > 0 && (
                                    <Badge className="bg-primary">{selectedConcerns.length}</Badge>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
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
                                                    selectedConcerns.includes(concern)
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
                        </AccordionContent>
                    </AccordionItem>

                    {/* 5. Damage Level */}
                    <AccordionItem value="damage" className="border-none bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">ダメージレベル</span>
                                <Badge className={cn("text-white border-none", getDamageColor(damageLevel))}>Lv.{damageLevel}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                            <div className="flex justify-end mb-4">
                                <Link
                                    href="/manual/damage-level"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary flex items-center hover:underline bg-primary/5 px-2 py-1 rounded-full"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    診断マニュアル（確認方法）
                                </Link>
                            </div>
                            <div className="flex justify-between gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDamageLevel(level)}
                                        className={cn(
                                            "flex-1 h-12 rounded-lg font-bold transition-all duration-200 flex flex-col items-center justify-center text-sm",
                                            damageLevel === level
                                                ? cn("text-white shadow-md scale-105", getDamageColor(level))
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground px-1">
                                <span>健康</span>
                                <span>ハイダメージ</span>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {showDiagnosisInputs && (
                        <>
                            {/* 6. Face Shape */}
                            <AccordionItem value="face" className="border-none bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Smile className="h-5 w-5 text-primary" />
                                        <span className="font-bold">顔型</span>
                                        {faceShape && <span className="text-sm font-normal text-muted-foreground ml-2">({FACE_SHAPES.find(f => f.id === faceShape)?.label})</span>}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <RadioGroup value={faceShape} onValueChange={setFaceShape} className="grid grid-cols-3 gap-3">
                                        {FACE_SHAPES.map((shape) => (
                                            <div key={shape.id}>
                                                <RadioGroupItem value={shape.id} id={`shape-${shape.id}`} className="peer sr-only" />
                                                <Label
                                                    htmlFor={`shape-${shape.id}`}
                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                                >
                                                    <span className="text-sm font-medium">{shape.label}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </AccordionContent>
                            </AccordionItem>

                            {/* 7. Personal Color */}
                            <AccordionItem value="color" className="border-none bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-5 w-5 text-primary" />
                                        <span className="font-bold">パーソナルカラー</span>
                                        {personalColorSeason && <span className="text-sm font-normal text-muted-foreground ml-2">({personalColorSeason})</span>}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0 space-y-4">
                                    {/* ... Content ... */}
                                    <div className="flex justify-end">
                                        <Link
                                            href="/manual/personal-color"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary flex items-center hover:underline bg-primary/5 px-2 py-1 rounded-full"
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            診断マニュアル（確認方法）
                                        </Link>
                                    </div>
                                    <div className="flex p-1 bg-muted rounded-lg">
                                        <button
                                            className={cn(
                                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                                personalColorBase === "warm" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => { setPersonalColorBase("warm"); }}
                                        >
                                            イエベ
                                        </button>
                                        <button
                                            className={cn(
                                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                                personalColorBase === "cool" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => { setPersonalColorBase("cool"); }}
                                        >
                                            ブルベ
                                        </button>
                                    </div>

                                    {personalColorBase && (
                                        <RadioGroup value={personalColorSeason} onValueChange={setPersonalColorSeason} className="grid grid-cols-2 gap-4">
                                            {personalColorBase === "warm" ? (
                                                <>
                                                    <div className="relative">
                                                        <RadioGroupItem value="spring" id="spring" className="peer sr-only" />
                                                        <Label htmlFor="spring" className="block text-center p-3 rounded-lg border-2 border-muted hover:border-accent cursor-pointer peer-data-[state=checked]:border-[#E3B23C] peer-data-[state=checked]:bg-[#E3B23C]/10 transition-all">
                                                            <span className="block font-bold text-[#E3B23C]">Spring (春)</span>
                                                        </Label>
                                                    </div>
                                                    <div className="relative">
                                                        <RadioGroupItem value="autumn" id="autumn" className="peer sr-only" />
                                                        <Label htmlFor="autumn" className="block text-center p-3 rounded-lg border-2 border-muted hover:border-accent cursor-pointer peer-data-[state=checked]:border-[#8B7355] peer-data-[state=checked]:bg-[#8B7355]/10 transition-all">
                                                            <span className="block font-bold text-[#8B7355]">Autumn (秋)</span>
                                                        </Label>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="relative">
                                                        <RadioGroupItem value="summer" id="summer" className="peer sr-only" />
                                                        <Label htmlFor="summer" className="block text-center p-3 rounded-lg border-2 border-muted hover:border-accent cursor-pointer peer-data-[state=checked]:border-[#6B9AC4] peer-data-[state=checked]:bg-[#6B9AC4]/10 transition-all">
                                                            <span className="block font-bold text-[#6B9AC4]">Summer (夏)</span>
                                                        </Label>
                                                    </div>
                                                    <div className="relative">
                                                        <RadioGroupItem value="winter" id="winter" className="peer sr-only" />
                                                        <Label htmlFor="winter" className="block text-center p-3 rounded-lg border-2 border-muted hover:border-accent cursor-pointer peer-data-[state=checked]:border-[#2C3E50] peer-data-[state=checked]:bg-[#2C3E50]/10 transition-all">
                                                            <span className="block font-bold text-[#2C3E50]">Winter (冬)</span>
                                                        </Label>
                                                    </div>
                                                </>
                                            )}
                                        </RadioGroup>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </>
                    )}

                    {/* 8. Request Area */}
                    <AccordionItem value="request" className="border-none bg-white rounded-xl shadow-sm overflow-hidden">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <span className="font-bold">本日のご要望</span>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                            <Textarea
                                placeholder="お客様のご要望を入力してください"
                                className="min-h-[120px] resize-none"
                                value={request}
                                onChange={(e) => setRequest(e.target.value)}
                            />
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>

                {!isNewFlow && isEditingDiagnosis && (
                    <div className="pt-1">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsEditingDiagnosis(false)}
                        >
                            診断編集を完了
                        </Button>
                    </div>
                )}

            </main>

            {/* 9. Create Next Button */}
            <div className="fixed bottom-0 w-full p-4 bg-white border-t border-border z-10">
                <Button
                    className="w-full text-lg h-12 shadow-md bg-gradient-to-r from-primary to-[#5C8D6D] hover:from-[#3D6949] hover:to-[#4A7C59]"
                    onClick={() => router.push(`/customers/${customerId}/counseling/menu`)}
                >
                    次へ：メニュー選択
                </Button>
            </div>
        </div>
    );
}
