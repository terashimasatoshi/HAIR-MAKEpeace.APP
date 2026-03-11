export type FaceType = "round" | "oval" | "long" | "base";

export const FACE_TYPE_LABELS: Record<FaceType, string> = {
  round: "丸顔",
  oval: "卵型",
  long: "面長",
  base: "ベース型",
};

export interface FaceMeasurements {
  widthRatio: number;
  jawRatio: number;
  chinAngle: number;
  foreheadRatio: number;
  faceLength: number;
  faceWidth: number;
  jawWidth: number;
  foreheadWidth: number;
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
}
