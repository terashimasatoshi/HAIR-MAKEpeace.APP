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

export const LANDMARK_IDS = {
  browCenter: 9,
  chin: 152,
  leftTemple: 234,
  rightTemple: 454,
  leftJaw: 172,
  rightJaw: 397,
  leftForehead: 71,
  rightForehead: 301,
} as const;

export function calculateFaceMetrics(
  landmarks: { x: number; y: number; z: number }[]
): FaceMeasurements {
  const faceLength = distance(landmarks[LANDMARK_IDS.browCenter], landmarks[LANDMARK_IDS.chin]);
  const faceWidth = distance(landmarks[LANDMARK_IDS.leftTemple], landmarks[LANDMARK_IDS.rightTemple]);
  const jawWidth = distance(landmarks[LANDMARK_IDS.leftJaw], landmarks[LANDMARK_IDS.rightJaw]);
  const foreheadWidth = distance(landmarks[LANDMARK_IDS.leftForehead], landmarks[LANDMARK_IDS.rightForehead]);

  const chinAngle = angleBetween(
    landmarks[LANDMARK_IDS.leftJaw],
    landmarks[LANDMARK_IDS.chin],
    landmarks[LANDMARK_IDS.rightJaw]
  );

  return {
    widthRatio: faceWidth / faceLength,
    jawRatio: jawWidth / faceWidth,
    chinAngle,
    foreheadRatio: foreheadWidth / faceWidth,
    faceLength,
    faceWidth,
    jawWidth,
    foreheadWidth,
  };
}

export async function analyzeFace(imageElement: HTMLImageElement | HTMLCanvasElement) {
  const landmarker = await initFaceLandmarker();
  const result = landmarker.detect(imageElement as HTMLImageElement);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    throw new Error("顔を検出できませんでした。もう一度お試しください。");
  }

  const landmarks = result.faceLandmarks[0];
  const measurements = calculateFaceMetrics(landmarks);

  return { landmarks, measurements };
}
