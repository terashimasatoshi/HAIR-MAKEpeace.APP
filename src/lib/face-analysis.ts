import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceMeasurements } from "@/types/face";

let faceLandmarker: FaceLandmarker | null = null;
let currentMode: "IMAGE" | "VIDEO" | null = null;

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

async function getFaceLandmarker(mode: "IMAGE" | "VIDEO"): Promise<FaceLandmarker> {
  if (faceLandmarker && currentMode === mode) return faceLandmarker;

  if (faceLandmarker) {
    await faceLandmarker.setOptions({ runningMode: mode });
    currentMode = mode;
    return faceLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  // GPU を試し、失敗したら CPU にフォールバック
  for (const delegate of ["GPU", "CPU"] as const) {
    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: mode,
        numFaces: 1,
        outputFacialTransformationMatrixes: false,
        outputFaceBlendshapes: false,
      });
      currentMode = mode;
      return faceLandmarker;
    } catch (e) {
      if (delegate === "CPU") throw e;
      console.warn("GPU delegate failed, falling back to CPU:", e);
    }
  }

  throw new Error("FaceLandmarker の初期化に失敗しました");
}

export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  return getFaceLandmarker("IMAGE");
}

export async function initFaceLandmarkerVideo(): Promise<FaceLandmarker> {
  return getFaceLandmarker("VIDEO");
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleBetween(
  a: { x: number; y: number },
  vertex: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const v1x = a.x - vertex.x;
  const v1y = a.y - vertex.y;
  const v2x = b.x - vertex.x;
  const v2y = b.y - vertex.y;

  const dot = v1x * v2x + v1y * v2y;
  const cross = v1x * v2y - v1y * v2x;
  const angleRad = Math.atan2(Math.abs(cross), dot);
  return angleRad * (180 / Math.PI);
}

// MediaPipe Face Landmarker ランドマークID
// 参考: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
export const LANDMARK_IDS = {
  // 顔の上端（おでこ中央上部）— 顔長さの起点
  faceTop: 10,
  // 眉間（旧: browCenter）— 中顔面の起点
  browCenter: 9,
  // 鼻下（上唇上端）— 中顔面と下顔面の境界
  noseBase: 2,
  // 顎先
  chin: 152,
  // こめかみ（顔の最大幅）
  leftTemple: 234,
  rightTemple: 454,
  // 頬骨（顔型判定で最重要）
  leftCheekbone: 93,
  rightCheekbone: 323,
  // エラ（顎角）
  leftJaw: 172,
  rightJaw: 397,
  // おでこ外側
  leftForehead: 54,
  rightForehead: 284,
  // 顔の左右対称性チェック用
  noseTip: 1,
  leftEar: 234,
  rightEar: 454,
} as const;

export function calculateFaceMetrics(
  landmarks: { x: number; y: number; z: number }[]
): FaceMeasurements {
  // 主要距離を計測
  const faceLength = distance(landmarks[LANDMARK_IDS.faceTop], landmarks[LANDMARK_IDS.chin]);
  const faceWidth = distance(landmarks[LANDMARK_IDS.leftTemple], landmarks[LANDMARK_IDS.rightTemple]);
  const jawWidth = distance(landmarks[LANDMARK_IDS.leftJaw], landmarks[LANDMARK_IDS.rightJaw]);
  const foreheadWidth = distance(landmarks[LANDMARK_IDS.leftForehead], landmarks[LANDMARK_IDS.rightForehead]);
  const cheekboneWidth = distance(landmarks[LANDMARK_IDS.leftCheekbone], landmarks[LANDMARK_IDS.rightCheekbone]);

  // 顎の角度
  const chinAngle = angleBetween(
    landmarks[LANDMARK_IDS.leftJaw],
    landmarks[LANDMARK_IDS.chin],
    landmarks[LANDMARK_IDS.rightJaw]
  );

  // 中顔面 vs 下顔面のバランス（面長判定に重要）
  const midFace = distance(landmarks[LANDMARK_IDS.browCenter], landmarks[LANDMARK_IDS.noseBase]);
  const lowerFace = distance(landmarks[LANDMARK_IDS.noseBase], landmarks[LANDMARK_IDS.chin]);
  const verticalBalance = lowerFace > 0 ? midFace / lowerFace : 1;

  return {
    widthRatio: faceWidth / faceLength,
    jawRatio: jawWidth / faceWidth,
    chinAngle,
    foreheadRatio: foreheadWidth / faceWidth,
    cheekboneRatio: cheekboneWidth / faceWidth,
    verticalBalance,
    faceLength,
    faceWidth,
    jawWidth,
    foreheadWidth,
    cheekboneWidth,
  };
}

/** 顔が正面を向いているか判定（左右対称性チェック） */
function isFaceFrontal(landmarks: { x: number; y: number; z: number }[]): boolean {
  const nose = landmarks[LANDMARK_IDS.noseTip];
  const leftTemple = landmarks[LANDMARK_IDS.leftTemple];
  const rightTemple = landmarks[LANDMARK_IDS.rightTemple];

  // 鼻先がこめかみの中点からどれだけずれているか
  const midX = (leftTemple.x + rightTemple.x) / 2;
  const faceWidth = Math.abs(rightTemple.x - leftTemple.x);
  const offset = Math.abs(nose.x - midX) / faceWidth;

  // 10%以上ずれていたら横向き
  return offset < 0.10;
}

export async function analyzeFace(imageElement: HTMLImageElement | HTMLCanvasElement) {
  const landmarker = await initFaceLandmarker();
  const result = landmarker.detect(imageElement as HTMLImageElement);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    throw new Error("顔を検出できませんでした。もう一度お試しください。");
  }

  const landmarks = result.faceLandmarks[0];

  if (!isFaceFrontal(landmarks)) {
    throw new Error("正面を向いて撮影してください。顔が横を向いています。");
  }

  const measurements = calculateFaceMetrics(landmarks);

  return { landmarks, measurements };
}
