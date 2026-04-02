"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FaceGuideOverlay } from "./FaceGuideOverlay";
import { initFaceLandmarkerVideo } from "@/lib/face-analysis";
import { calculateFaceMetrics, LANDMARK_IDS } from "@/lib/face-analysis";
import { calculateScores } from "@/lib/face-templates";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FaceMeasurements, FaceScores, FaceType } from "@/types/face";

/** 集約に使うフレーム数 */
const AGGREGATE_FRAMES = 24;
/** フレーム取得間隔（ms） */
const FRAME_INTERVAL = 120;
/** 明るさ閾値: 顔領域の平均輝度(0-255)がこれ未満→暗すぎ */
const MIN_BRIGHTNESS = 55;
/** 顔サイズ閾値: 顔幅(正規化0〜1)がこの値未満→顔が小さすぎ */
const MIN_FACE_WIDTH_RATIO = 0.12;
/** 正面向き閾値: 鼻先が顔幅中点から何%ずれたら横向き判定 */
const MAX_POSE_OFFSET = 0.10;
/** フレーム間の鼻先移動量(正規化座標)がこれを超えるとブレ扱い */
const MAX_MOTION_DELTA = 0.018;

/** フレーム除外理由 */
type RejectReason = "no_face" | "pose_tilt" | "low_light" | "small_face" | "motion_blur";

interface CameraProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
  /** 複数フレーム集約の結果を返す（設定時は集約モード） */
  onAggregatedResult?: (result: {
    faceType: FaceType;
    scores: FaceScores;
    confidence: number;
    measurements: FaceMeasurements;
    landmarks: { x: number; y: number; z: number }[];
    validFrames: number;
    /** フレーム除外理由ごとの回数 */
    rejectCounts: Record<RejectReason, number>;
    /** キャプチャ画像（データURL） */
    imageDataUrl: string;
    /** キャプチャ画像サイズ */
    imageSize: { width: number; height: number };
  }) => void;
}

export function Camera({ onCapture, onAggregatedResult }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | undefined>(undefined);
  const [landmarkerReady, setLandmarkerReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  /** エラーの種別: camera=カメラ権限エラー, analysis=解析エラー(リトライ可) */
  const [errorType, setErrorType] = useState<"camera" | "analysis" | null>(null);

  // 顔検出を1回実行
  const detectOnce = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2 || video.paused) return;

    const now = performance.now();
    if (now <= lastTimestampRef.current) return;
    lastTimestampRef.current = now;

    try {
      const result = landmarker.detectForVideo(video, now);
      setFaceDetected(
        !!(result.faceLandmarks && result.faceLandmarks.length > 0)
      );
    } catch (e) {
      console.warn("face detect error:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      // リトライ時にstateをリセット（非同期関数内で呼び出し）
      setError(null);
      setErrorType(null);
      setIsReady(false);
      setFaceDetected(undefined);
      setIsCapturing(false);
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 960, max: 1440 },
          },
          audio: false,
        });
      } catch (e) {
        console.error("getUserMedia failed:", e);
        if (mounted) {
          setError("カメラにアクセスできません。カメラの使用を許可してください。");
          setErrorType("camera");
        }
        return;
      }

      if (!mounted) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          if (mounted) setIsReady(true);
        };
      }

      try {
        const landmarker = await initFaceLandmarkerVideo();
        if (mounted) {
          landmarkerRef.current = landmarker;
          setLandmarkerReady(true);
        }
      } catch (e) {
        console.warn("MediaPipe init failed, camera-only mode:", e);
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [retryCount]);

  useEffect(() => {
    if (!isReady || !landmarkerReady) return;

    timerRef.current = setInterval(detectOnce, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReady, landmarkerReady, detectOnce]);

  /** 複数フレーム集約キャプチャ */
  const handleAggregatedCapture = useCallback(async () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) return;

    setIsCapturing(true);
    setCaptureProgress(0);

    // 検出ループを一時停止
    if (timerRef.current) clearInterval(timerRef.current);

    const frameResults: {
      faceType: FaceType;
      scores: FaceScores;
      confidence: number;
      measurements: FaceMeasurements;
      landmarks: { x: number; y: number; z: number }[];
    }[] = [];

    const rejectCounts: Record<RejectReason, number> = {
      no_face: 0, pose_tilt: 0, low_light: 0, small_face: 0, motion_blur: 0,
    };
    let prevNose: { x: number; y: number } | null = null;

    // 明るさ計測用の一時canvas
    const brightnessCanvas = document.createElement("canvas");
    const brightnessCtx = brightnessCanvas.getContext("2d", { willReadFrequently: true })!;

    // フレームを収集
    for (let i = 0; i < AGGREGATE_FRAMES; i++) {
      setCaptureProgress(Math.round(((i + 1) / AGGREGATE_FRAMES) * 100));

      await new Promise((r) => setTimeout(r, FRAME_INTERVAL));

      if (video.readyState < 2 || video.paused) continue;

      const now = performance.now();
      if (now <= lastTimestampRef.current) continue;
      lastTimestampRef.current = now;

      try {
        const result = landmarker.detectForVideo(video, now);
        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
          rejectCounts.no_face++;
          continue;
        }

        const landmarks = result.faceLandmarks[0];

        // 品質ゲート1: 正面向きチェック
        const nose = landmarks[1];
        const leftT = landmarks[LANDMARK_IDS.leftTemple];
        const rightT = landmarks[LANDMARK_IDS.rightTemple];
        const midX = (leftT.x + rightT.x) / 2;
        const fw = Math.abs(rightT.x - leftT.x);
        if (Math.abs(nose.x - midX) / fw >= MAX_POSE_OFFSET) {
          rejectCounts.pose_tilt++;
          continue;
        }

        // 品質ゲート1.5: フレーム間ブレ検出
        if (prevNose) {
          const dx = nose.x - prevNose.x;
          const dy = nose.y - prevNose.y;
          const motion = Math.sqrt(dx * dx + dy * dy);
          if (motion > MAX_MOTION_DELTA) {
            rejectCounts.motion_blur++;
            prevNose = { x: nose.x, y: nose.y };
            continue;
          }
        }
        prevNose = { x: nose.x, y: nose.y };

        // 品質ゲート2: 顔サイズチェック（顔幅がフレーム幅に対して十分か）
        if (fw < MIN_FACE_WIDTH_RATIO) {
          rejectCounts.small_face++;
          continue;
        }

        // 品質ゲート3: 明るさチェック（顔領域の平均輝度）
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const faceX = Math.max(0, Math.floor((leftT.x) * vw));
        const faceY = Math.max(0, Math.floor((landmarks[LANDMARK_IDS.faceTop].y) * vh));
        const faceW = Math.min(Math.floor(fw * vw), vw - faceX);
        const faceH = Math.min(Math.floor((landmarks[LANDMARK_IDS.chin].y - landmarks[LANDMARK_IDS.faceTop].y) * vh), vh - faceY);

        if (faceW > 0 && faceH > 0) {
          brightnessCanvas.width = faceW;
          brightnessCanvas.height = faceH;
          brightnessCtx.drawImage(video, faceX, faceY, faceW, faceH, 0, 0, faceW, faceH);
          const imgData = brightnessCtx.getImageData(0, 0, faceW, faceH);
          const pixels = imgData.data;
          let totalLum = 0;
          const pixelCount = pixels.length / 4;
          // サンプリング（全ピクセルは重いので10ピクセルおき）
          const step = Math.max(1, Math.floor(pixelCount / 500)) * 4;
          let samples = 0;
          for (let p = 0; p < pixels.length; p += step) {
            // ITU-R BT.601 輝度
            totalLum += pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114;
            samples++;
          }
          const avgBrightness = samples > 0 ? totalLum / samples : 128;
          if (avgBrightness < MIN_BRIGHTNESS) {
            rejectCounts.low_light++;
            continue;
          }
        }

        const measurements = calculateFaceMetrics(landmarks);
        const { scores, faceType, confidence } = calculateScores(measurements);

        frameResults.push({ faceType, scores, confidence, measurements, landmarks });
      } catch (e) {
        console.warn("frame analysis skipped:", e);
      }
    }

    setIsCapturing(false);

    if (frameResults.length === 0) {
      // 失敗: カメラは停止せず、エラー表示して再試行可能にする
      const topReason = (Object.entries(rejectCounts) as [RejectReason, number][])
        .sort((a, b) => b[1] - a[1])[0];

      const messages: Record<RejectReason, string> = {
        no_face: "顔を検出できませんでした。カメラに顔全体が映るようにしてください。",
        pose_tilt: "顔が横を向いています。正面をまっすぐ向いて撮影してください。",
        low_light: "撮影が暗すぎます。明るい場所に移動してください。",
        small_face: "顔が小さすぎます。カメラにもう少し近づいてください。",
        motion_blur: "顔が動いています。2秒ほど動かずに正面を向いてください。",
      };

      setError(topReason && topReason[1] > 0
        ? messages[topReason[0]]
        : "顔を安定して検出できませんでした。再度お試しください。"
      );
      setErrorType("analysis");

      // 検出ループを再開（カメラは動いたまま）
      if (landmarkerRef.current) {
        timerRef.current = setInterval(detectOnce, 200);
      }
      return;
    }

    // 成功: 画像キャプチャ
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // カメラ停止（成功時のみ）
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // 集約: confidence重み付きで特徴量を平均し、1回だけ分類
    // （旧方式: フレームごと分類→多数決 → ランドマークノイズに弱い）
    // （新方式: 特徴量平均→1回分類 → ノイズが√N倍削減される）
    const n = frameResults.length;

    // confidence下位25%を除外（低品質フレーム排除）
    const sorted = [...frameResults].sort((a, b) => b.confidence - a.confidence);
    const cutoff = Math.max(1, Math.floor(n * 0.75));
    const topFrames = sorted.slice(0, cutoff);

    // confidence重み付き平均で特徴量を集約
    const measurementKeys: (keyof FaceMeasurements)[] = [
      "widthRatio", "jawRatio", "chinAngle", "foreheadRatio",
      "cheekboneRatio", "verticalBalance", "faceLength", "faceWidth",
      "jawWidth", "foreheadWidth", "cheekboneWidth",
    ];
    let totalWeight = 0;
    const weightedSums: Record<string, number> = {};
    for (const key of measurementKeys) weightedSums[key] = 0;

    for (const fr of topFrames) {
      const w = Math.max(1, fr.confidence); // confidence=0でも最低重み1
      totalWeight += w;
      for (const key of measurementKeys) {
        weightedSums[key] += fr.measurements[key] * w;
      }
    }

    const avgMeasurements = {} as Record<string, number>;
    for (const key of measurementKeys) {
      avgMeasurements[key] = weightedSums[key] / totalWeight;
    }

    // 平均特徴量で1回だけ分類
    const { scores: finalScores, faceType: finalType, confidence: finalConfidence } = calculateScores(avgMeasurements as unknown as FaceMeasurements);

    // 最もconfidenceが高いフレームのlandmarksを代表値として使用
    const bestFrame = sorted[0];

    // 画像データURLを生成
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);

    if (onAggregatedResult) {
      // 集約モード: 画像を含めて一括で渡す（onCaptureは呼ばない）
      onAggregatedResult({
        faceType: finalType,
        scores: finalScores,
        confidence: finalConfidence,
        measurements: avgMeasurements as unknown as FaceMeasurements,
        landmarks: bestFrame.landmarks,
        validFrames: n,
        rejectCounts,
        imageDataUrl,
        imageSize: { width: canvas.width, height: canvas.height },
      });
    } else {
      // フォールバック: 単発モード
      onCapture(canvas);
    }
  }, [onCapture, onAggregatedResult]);

  /** 単発キャプチャ（フォールバック用） */
  const handleSingleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    onCapture(canvas);
  }, [onCapture]);

  // カメラ権限エラー: リトライボタンで再起動を試みる
  if (error && errorType === "camera") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <p className="text-muted-foreground text-sm">
          設定からカメラへのアクセスを許可してください。
        </p>
        <Button variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
          もう一度試す
        </Button>
      </div>
    );
  }

  const canCapture = isReady && !isCapturing && (landmarkerReady ? !!faceDetected : true);
  const useAggregation = landmarkerReady && onAggregatedResult;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {isReady && <FaceGuideOverlay faceDetected={landmarkerReady ? faceDetected : undefined} />}

        {/* 集約キャプチャ中のプログレス */}
        {isCapturing && (
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-bold">
              解析中... {captureProgress}%
            </p>
            <p className="text-white/80 text-xs">
              動かないでください
            </p>
          </div>
        )}
      </div>

      {/* 解析エラー: カメラは動いたまま再試行を促す */}
      {error && errorType === "analysis" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-red-600 text-sm font-bold mb-1">{error}</p>
          <p className="text-red-500 text-xs mb-2">条件を調整して、もう一度撮影してください</p>
        </div>
      )}

      <div className="text-center space-y-1">
        {!(error && errorType === "analysis") && (
          <p className="text-muted-foreground text-sm">
            {isCapturing
              ? "そのまま正面を向いてお待ちください"
              : !landmarkerReady
                ? "顔をガイド枠に合わせてください"
                : faceDetected
                  ? "顔を検出しました。撮影できます"
                  : "正面を向いて、枠内に顔全体を合わせてください"}
          </p>
        )}
        {!isCapturing && landmarkerReady && !error && (
          <div className="text-xs text-muted-foreground/70 space-y-0.5">
            <p>精度を上げるコツ：</p>
            <p>・前髪を上げて額を出す ・明るい場所 ・正面を向く ・無表情</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => {
          setError(null);
          setErrorType(null);
          (useAggregation ? handleAggregatedCapture : handleSingleCapture)();
        }}
        disabled={!canCapture}
        size="lg"
        className="min-w-[200px]"
      >
        {isCapturing ? "解析中..." : error ? "もう一度撮影する" : "撮影する"}
      </Button>
    </div>
  );
}
