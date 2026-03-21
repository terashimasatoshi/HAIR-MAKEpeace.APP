import { FaceMeasurements, FaceScores, FaceType } from "@/types/face";

const FACE_TEMPLATES = {
  oval:  { widthRatio: 1.00, jawRatio: 0.65, chinAngle: 110 },
  round: { widthRatio: 1.25, jawRatio: 0.78, chinAngle: 130 },
  long:  { widthRatio: 0.80, jawRatio: 0.62, chinAngle: 110 },
  base:  { widthRatio: 1.40, jawRatio: 0.88, chinAngle: 125 },
} as const;

const SCALES = {
  widthRatio: 12,
  jawRatio: 8,
  chinAngle: 0.08,
};

// softmax温度（低いほどスコア差がマイルドになる）
const SOFTMAX_TEMPERATURE = 0.8;

function calculateDistance(
  measurements: FaceMeasurements,
  template: (typeof FACE_TEMPLATES)[FaceType]
): number {
  const dWidth =
    (measurements.widthRatio - template.widthRatio) * SCALES.widthRatio;
  const dJaw = (measurements.jawRatio - template.jawRatio) * SCALES.jawRatio;
  const dAngle =
    (measurements.chinAngle - template.chinAngle) * SCALES.chinAngle;
  return Math.sqrt(dWidth * dWidth + dJaw * dJaw + dAngle * dAngle);
}

export function calculateScores(measurements: FaceMeasurements): {
  scores: FaceScores;
  faceType: FaceType;
} {
  const faceTypes: FaceType[] = ["round", "oval", "long", "base"];

  const distances: Record<FaceType, number> = {} as Record<FaceType, number>;
  for (const type of faceTypes) {
    distances[type] = calculateDistance(measurements, FACE_TEMPLATES[type]);
  }

  // longの判定を厳しくする: widthRatioが0.80未満でないとlongにペナルティ
  if (measurements.widthRatio >= 0.80) {
    distances.long += 1.5;
  }

  const expScores: Record<FaceType, number> = {} as Record<FaceType, number>;
  let sumExp = 0;
  for (const type of faceTypes) {
    const exp = Math.exp(-distances[type] * SOFTMAX_TEMPERATURE);
    expScores[type] = exp;
    sumExp += exp;
  }

  const scores: FaceScores = {} as FaceScores;
  let maxType: FaceType = "oval";
  let maxScore = 0;

  for (const type of faceTypes) {
    scores[type] = Math.round((expScores[type] / sumExp) * 100);
    if (scores[type] > maxScore) {
      maxScore = scores[type];
      maxType = type;
    }
  }

  const totalScore = faceTypes.reduce((sum, type) => sum + scores[type], 0);
  if (totalScore !== 100) {
    scores[maxType] += 100 - totalScore;
  }

  return { scores, faceType: maxType };
}
