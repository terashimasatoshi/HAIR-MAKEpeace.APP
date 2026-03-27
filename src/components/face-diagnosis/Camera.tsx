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
const AGGREGATE_FRAMES = 12;
/** フレーム取得間隔（ms） */
const FRAME_INTERVAL = 150;
/** 明るさ閾値: 顔領域の平均輝度(0-255)がこれ未満→暗すぎ */
const MIN_BRIGHTNESS = 55;
/** 顔サイズ閾値: 顔幅がフレーム幅に対してこの比率未満→顔が小さすぎ */
const MIN_FACE_AREA_RATIO = 0.12;
/** 正面向き閾値: 鼻先が顔幅中点から何%ずれたら横向き判定 */
const MAX_POSE_OFFSET = 0.10;

/** フレーム除外理由 */
type RejectReason = "no_face" | "pose_tilt" | "low_light" | "small_face";

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
  }, []);

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
      no_face: 0, pose_tilt: 0, low_light: 0, small_face: 0,
    };

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

        // 品質ゲート2: 顔サイズチェック（顔幅がフレーム幅に対して十分か）
        if (fw < MIN_FACE_AREA_RATIO) {
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

    // 最終フレームの画像をキャプチャ（結果表示用）
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // カメラ停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsCapturing(false);

    if (frameResults.length === 0) {
      // 最多の除外理由に応じたメッセージ
      const topReason = (Object.entries(rejectCounts) as [RejectReason, number][])
        .sort((a, b) => b[1] - a[1])[0];

      const messages: Record<RejectReason, string> = {
        no_face: "顔を検出できませんでした。カメラに顔全体が映るようにしてください。",
        pose_tilt: "顔が横を向いています。正面をまっすぐ向いて撮影してください。",
        low_light: "撮影が暗すぎます。明るい場所に移動してください。",
        small_face: "顔が小さすぎます。カメラにもう少し近づいてください。",
      };

      setError(topReason && topReason[1] > 0
        ? messages[topReason[0]]
        : "顔を安定して検出できませんでした。再度お試しください。"
      );
      return;
    }

    // 集約: 多数決 + 平均スコア
    const typeCounts: Record<FaceType, number> = { round: 0, oval: 0, long: 0, base: 0 };
    const avgScores: Record<FaceType, number> = { round: 0, oval: 0, long: 0, base: 0 };
    let totalConfidence = 0;

    for (const fr of frameResults) {
      typeCounts[fr.faceType]++;
      for (const t of ["round", "oval", "long", "base"] as FaceType[]) {
        avgScores[t] += fr.scores[t];
      }
      totalConfidence += fr.confidence;
    }

    const n = frameResults.length;
    for (const t of ["round", "oval", "long", "base"] as FaceType[]) {
      avgScores[t] = Math.round(avgScores[t] / n);
    }

    // 多数決で最終顔型
    let finalType: FaceType = "oval";
    let maxCount = 0;
    for (const t of ["round", "oval", "long", "base"] as FaceType[]) {
      if (typeCounts[t] > maxCount) {
        maxCount = typeCounts[t];
        finalType = t;
      }
    }

    // 平均信頼度
    const avgConfidence = Math.round(totalConfidence / n);

    // 合計100%に補正
    const totalAvg = avgScores.round + avgScores.oval + avgScores.long + avgScores.base;
    if (totalAvg !== 100) {
      avgScores[finalType] += 100 - totalAvg;
    }

    // 最後のフレームのlandmarksとmeasurementsを代表値として使用
    const lastFrame = frameResults[frameResults.length - 1];

    if (onAggregatedResult) {
      onAggregatedResult({
        faceType: finalType,
        scores: avgScores as FaceScores,
        confidence: avgConfidence,
        measurements: lastFrame.measurements,
        landmarks: lastFrame.landmarks,
        validFrames: n,
        rejectCounts,
      });
    }

    // canvasも渡す（画像表示用）
    onCapture(canvas);
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <p className="text-muted-foreground text-sm">
          設定からカメラへのアクセスを許可してから、ページを再読み込みしてください。
        </p>
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
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-muted-foreground text-sm">
          {isCapturing
            ? "そのまま正面を向いてお待ちください"
            : !landmarkerReady
              ? "顔をガイド枠に合わせてください"
              : faceDetected
                ? "顔を検出しました。撮影できます"
                : "正面を向いて、枠内に顔全体を合わせてください"}
        </p>
        {!isCapturing && landmarkerReady && (
          <p className="text-xs text-muted-foreground/70">
            明るい場所で、前髪は分けて額を出すと精度が上がります
          </p>
        )}
      </div>

      <Button
        onClick={useAggregation ? handleAggregatedCapture : handleSingleCapture}
        disabled={!canCapture}
        size="lg"
        className="min-w-[200px]"
      >
        {isCapturing ? "解析中..." : "撮影する"}
      </Button>
    </div>
  );
}
