export type DamageLevel = 1 | 2 | 3 | 4 | 5;
export type CurlIntensity = 'straight' | 'light' | 'medium' | 'strong';
export type ColorHistory = 'none' | '1month' | '3months' | '6months' | '1year_plus';
export type BleachCount = 'none' | '1' | '2-3' | '4plus';
export type StraighteningDate = '1month' | '3months' | '6months_plus' | 'none';
export type Texture = 'smooth' | 'rough' | 'soft' | 'sticky';
export type Timing = 'before' | 'after';
export type SessionStatus = 'draft' | 'in_progress' | 'completed';

export interface HairConditionBySection {
  root: { damage: DamageLevel; curl: CurlIntensity; };
  middle: { damage: DamageLevel; curl: CurlIntensity; };
  ends: { damage: DamageLevel; curl: CurlIntensity; };
}

export interface TreatmentHistory {
  lastColor: ColorHistory;
  bleachCount: BleachCount;
  lastStraightening: StraighteningDate;
  notes?: string;
}

export interface StaffAssessment {
  overallCondition: string;
  concerns: string[];
  notes?: string;
}

export interface AITreatmentPlan {
  recommendedMenu: string;
  recommendedPrice: number;
  durationMinutes: number;
  productSelection: {
    root: { product: string; ph: string; reason: string; };
    middle: { product: string; ph: string; reason: string; };
    ends: { product: string; ph: string; reason: string; };
  };
  treatmentProcess: Array<{
    step: number;
    action: string;
    timeMinutes: number;
    temperature?: string;
    notes: string;
  }>;
  risksAndPrecautions: string[];
  expectedResults: {
    shine: string;
    texture: string;
    duration: string;
  };
  homeCareAdvice: string;
  nextVisitRecommendation: string;
}

export interface CounselingSession {
  id: string;
  customer_id: string;
  stylist_id: string;
  store_id: string;
  session_date: string;
  status: SessionStatus;
  before_condition: HairConditionBySection;
  treatment_history: TreatmentHistory;
  staff_assessment: StaffAssessment;
  ai_plan?: AITreatmentPlan;
  after_condition?: HairConditionBySection;
  after_texture?: Texture;
  after_notes?: string;
  report_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  line_user_id?: string;
  created_at: string;
  updated_at: string;
}
