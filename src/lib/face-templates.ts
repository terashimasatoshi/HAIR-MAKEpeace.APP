import { FaceMeasurements, FaceScores, FaceType } from "@/types/face";

/**
 * 顔型テンプレート
 *
 * MediaPipe landmarks使用時の実測ベース値:
 * - widthRatio: こめかみ幅 / (おでこ上端〜顎先) — 正面顔で0.65〜0.90程度
 * - jawRatio: エラ幅 / こめかみ幅 — 顎の張り具合
 * - chinAngle: エラ-顎先-エラの角度（度） — 顎のシャープさ
 * - foreheadRatio: おでこ幅 / こめかみ幅 — おでこの広さ
 * - cheekboneRatio: 頬骨幅 / こめかみ幅 — 頬の張り具合
 * - verticalBalance: 中顔面 / 下顔面 — 顔の縦バランス
 */
const FACE_TEMPLATES: Record<FaceType, {
  widthRatio: number;
  jawRatio: number;
  chinAngle: number;
  foreheadRatio: number;
  cheekboneRatio: number;
  verticalBalance: number;
}> = {
  // 卵型: バランスが良い。顎がやや細く、頬骨が適度
  oval: {
    widthRatio: 0.74,
    jawRatio: 0.68,
    chinAngle: 95,
    foreheadRatio: 0.84,
    cheekboneRatio: 0.92,
    verticalBalance: 1.0,
  },
  // 丸顔: 横幅が広い。顎もエラも丸みがある。顎の角度が大きい
  round: {
    widthRatio: 0.85,
    jawRatio: 0.80,
    chinAngle: 120,
    foreheadRatio: 0.83,
    cheekboneRatio: 0.95,
    verticalBalance: 0.95,
  },
  // 面長: 縦が長い。横幅が狭い。中顔面〜下顔面が長め
  long: {
    widthRatio: 0.65,
    jawRatio: 0.70,
    chinAngle: 90,
    foreheadRatio: 0.85,
    cheekboneRatio: 0.90,
    verticalBalance: 1.15,
  },
  // ベース型: エラが張っている。顎幅が顔幅に近い。角張った印象
  base: {
    widthRatio: 0.80,
    jawRatio: 0.90,
    chinAngle: 115,
    foreheadRatio: 0.80,
    cheekboneRatio: 0.88,
    verticalBalance: 1.0,
  },
};

/**
 * 各特徴量の重み（判別力が高い特徴ほど大きく）
 *
 * widthRatio: 面長 vs 丸顔の主要判別要素
 * jawRatio: ベース型の主要判別要素
 * chinAngle: 丸顔 vs 卵型の判別
 * foreheadRatio: 補助的
 * cheekboneRatio: 補助的
 * verticalBalance: 面長の判別に重要
 */
const WEIGHTS = {
  widthRatio: 14,
  jawRatio: 12,
  chinAngle: 0.10,
  foreheadRatio: 6,
  cheekboneRatio: 5,
  verticalBalance: 8,
};

// softmax温度（低いほどスコア差が出やすい）
const SOFTMAX_TEMPERATURE = 1.0;

function calculateDistance(
  measurements: FaceMeasurements,
  template: (typeof FACE_TEMPLATES)[FaceType]
): number {
  const dWidth = (measurements.widthRatio - template.widthRatio) * WEIGHTS.widthRatio;
  const dJaw = (measurements.jawRatio - template.jawRatio) * WEIGHTS.jawRatio;
  const dAngle = (measurements.chinAngle - template.chinAngle) * WEIGHTS.chinAngle;
  const dForehead = (measurements.foreheadRatio - template.foreheadRatio) * WEIGHTS.foreheadRatio;
  const dCheekbone = (measurements.cheekboneRatio - template.cheekboneRatio) * WEIGHTS.cheekboneRatio;
  const dVertical = (measurements.verticalBalance - template.verticalBalance) * WEIGHTS.verticalBalance;

  return Math.sqrt(
    dWidth * dWidth +
    dJaw * dJaw +
    dAngle * dAngle +
    dForehead * dForehead +
    dCheekbone * dCheekbone +
    dVertical * dVertical
  );
}

export function calculateScores(measurements: FaceMeasurements): {
  scores: FaceScores;
  faceType: FaceType;
  confidence: number;
} {
  const faceTypes: FaceType[] = ["round", "oval", "long", "base"];

  const distances: Record<FaceType, number> = {} as Record<FaceType, number>;
  for (const type of faceTypes) {
    distances[type] = calculateDistance(measurements, FACE_TEMPLATES[type]);
  }

  // ルールベースの補正（数値だけでは判別しにくいケースを補助）

  // ベース型の条件強化: jawRatioが0.85以上で明確にエラ張り
  if (measurements.jawRatio >= 0.85) {
    distances.base *= 0.7;  // ベース型に近づける
    distances.oval *= 1.3;  // 卵型から遠ざける
  }

  // 面長の条件強化: widthRatioが0.70未満で明確に縦長
  if (measurements.widthRatio < 0.70) {
    distances.long *= 0.7;
    distances.round *= 1.3;
  }

  // 丸顔の条件強化: widthRatioが高く、jawRatioも高く、chinAngleも大きい
  if (measurements.widthRatio > 0.80 && measurements.chinAngle > 110 && measurements.jawRatio < 0.85) {
    distances.round *= 0.8;
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

  // 信頼度: 1位と2位のスコア差（0〜100）
  const sorted = faceTypes.map((t) => scores[t]).sort((a, b) => b - a);
  const confidence = sorted[0] - sorted[1];

  return { scores, faceType: maxType, confidence };
}
