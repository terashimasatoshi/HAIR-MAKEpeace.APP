export type FaceType = "round" | "oval" | "long" | "base";

export const FACE_TYPE_LABELS: Record<FaceType, string> = {
  round: "丸顔",
  oval: "卵型",
  long: "面長",
  base: "ベース型",
};

export interface FaceMeasurements {
  widthRatio: number;       // faceWidth / faceLength
  jawRatio: number;         // jawWidth / faceWidth
  chinAngle: number;        // 顎の角度（度）
  foreheadRatio: number;    // foreheadWidth / faceWidth
  cheekboneRatio: number;   // cheekboneWidth / faceWidth
  verticalBalance: number;  // midFace / lowerFace 比率
  faceLength: number;
  faceWidth: number;
  jawWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
}

export interface FaceScores {
  round: number;
  oval: number;
  long: number;
  base: number;
}

export interface DiagnosisResult {
  faceType: FaceType;
  scores: FaceScores;
  measurements: FaceMeasurements;
  landmarks: { x: number; y: number; z: number }[];
  /** 判定信頼度 0〜100。1位と2位のスコア差が大きいほど高い */
  confidence: number;
}

/** 信頼度しきい値: これ未満は「判定保留」 */
export const CONFIDENCE_THRESHOLD = 15;
