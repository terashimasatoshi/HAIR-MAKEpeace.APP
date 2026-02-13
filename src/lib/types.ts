// ==========================================
// 髪質改善カウンセリングアプリ 型定義
// ==========================================

// 基本型
export type DamageLevel = 1 | 2 | 3 | 4 | 5;
export type CurlIntensity = 'straight' | 'light' | 'medium' | 'strong';
export type ColorHistory = 'none' | '1month' | '3months' | '6months' | '1year_plus';
export type BleachCount = 'none' | '1' | '2-3' | '4plus';
export type LastTreatmentDate = '1month' | '3months' | '6months_plus';
export type Texture = 'smooth' | 'rough' | 'soft' | 'sticky';
export type SessionStatus = 'draft' | 'in_progress' | 'completed';

// 部位別髪状態
export interface HairConditionBySection {
  root: {
    damage: DamageLevel;
    curl: CurlIntensity;
  };
  middle: {
    damage: DamageLevel;
    curl: CurlIntensity;
  };
  ends: {
    damage: DamageLevel;
    curl: CurlIntensity;
  };
}

// 施術履歴
export interface TreatmentHistory {
  lastColor: ColorHistory;
  bleachCount: BleachCount;
  bleachLastDate?: LastTreatmentDate;
  hasStraitening: boolean;
  straighteningLastDate?: LastTreatmentDate;
}

// スタッフ所見
export interface StaffAssessment {
  assessmentNotes: string;
  concerns: string;
  customerRequests: string;
}

// 施術後の状態
export interface HairConditionAfter {
  root: { damage: DamageLevel };
  middle: { damage: DamageLevel };
  ends: { damage: DamageLevel };
  shineLevel: DamageLevel;
  texture: Texture;
  manageability: DamageLevel;
}

// カウンセリングフォームデータ
export interface CounselingFormData {
  customerId: string;
  // 施術前
  hairConditionBefore: HairConditionBySection;
  treatmentHistory: TreatmentHistory;
  staffAssessment: StaffAssessment;
  
  // 施術後
  hairConditionAfter?: HairConditionAfter;
  actualTreatment?: {
    menuName: string;
    productsUsed: string[];
    staffComments: string;
  };
  
  // AIプラン
  aiPlan?: AITreatmentPlan;
}

// 顧客情報
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  lineUserId?: string;
  lastVisitDate?: string;
  visitCount: number;
}

// AI施術プラン
export interface AITreatmentPlan {
  recommendedMenu: string;
  recommendedPrice: number;
  durationMinutes: number;
  productSelection: {
    root: { product: string; ph: string; reason: string };
    middle: { product: string; ph: string; reason: string };
    ends: { product: string; ph: string; reason: string };
  };
  treatmentProcess: {
    step: number;
    action: string;
    timeMinutes: number;
    temperature?: string;
    notes: string;
  }[];
  risksAndPrecautions: string[];
  expectedResults: {
    shine: string;
    texture: string;
    duration: string;
  };
  homeCareAdvice: string;
  nextVisitRecommendation: string;
}

// Supabaseテーブル型
export interface CustomerRow {
  id: string;
  store_id: string;
  name: string;
  phone: string | null;
  line_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  customer_id: string;
  staff_id: string;
  store_id: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

// スタッフの処方データ
export interface SectionPrescription {
  product: string;
  amount: number;
  incline: number;
  ritpinoH: number;
}

export interface StaffPrescription {
  powerLevel: number;
  root: SectionPrescription;
  middle: SectionPrescription;
  ends: SectionPrescription;
  ironTemperature: number;
  notes: string;
}

// AIレビュー結果
export interface AIReviewResult {
  overall: 'good' | 'caution' | 'warning';
  sections: {
    root: { status: 'ok' | 'caution' | 'warning'; message: string };
    middle: { status: 'ok' | 'caution' | 'warning'; message: string };
    ends: { status: 'ok' | 'caution' | 'warning'; message: string };
  };
  suggestions: string[];
  precautions: string[];
}

// スタッフの処方データ
export interface SectionPrescription {
  product: string;
  amount: number;
  incline: number;
  ritpinoH: number;
}

export interface StaffPrescription {
  powerLevel: number;
  root: SectionPrescription;
  middle: SectionPrescription;
  ends: SectionPrescription;
  ironTemperature: number;
  notes: string;
}

// AIレビュー結果
export interface AIReviewResult {
  overall: 'good' | 'caution' | 'warning';
  sections: {
    root: { status: 'ok' | 'caution' | 'warning'; message: string };
    middle: { status: 'ok' | 'caution' | 'warning'; message: string };
    ends: { status: 'ok' | 'caution' | 'warning'; message: string };
  };
  suggestions: string[];
  precautions: string[];
}
