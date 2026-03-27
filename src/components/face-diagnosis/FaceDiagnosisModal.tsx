"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "./Camera";
import { FaceMeshOverlay } from "./FaceMeshOverlay";
import { ResultChart } from "./ResultChart";
import { analyzeFace } from "@/lib/face-analysis";
import { calculateScores } from "@/lib/face-templates";
import {
  DiagnosisResult,
  FaceType,
  FaceScores,
  FaceMeasurements,
  FACE_TYPE_LABELS,
  CONFIDENCE_THRESHOLD,
} from "@/types/face";

// 顔型診断の結果を既存カウンセリングアプリのIDにマッピング
const FACE_TYPE_TO_COUNSELING_ID: Record<FaceType, string> = {
  oval: "egg",
  round: "round",
  long: "long",
  base: "base",
};

interface FaceDiagnosisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (faceShapeId: string) => void;
}

type Phase = "camera" | "analyzing" | "result";

export function FaceDiagnosisModal({
  open,
  onOpenChange,
  onResult,
}: FaceDiagnosisModalProps) {
  const [phase, setPhase] = useState<Phase>("camera");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [capturedSize, setCapturedSize] = useState<{ width: number; height: number }>({ width: 480, height: 360 });
  const [error, setError] = useState<string | null>(null);
  const [validFrames, setValidFrames] = useState(0);
  const [rejectCounts, setRejectCounts] = useState<Record<string, number>>({});

  /** 複数フレーム集約の結果を受け取る */
  const handleAggregatedResult = useCallback((aggResult: {
    faceType: FaceType;
    scores: FaceScores;
    confidence: number;
    measurements: FaceMeasurements;
    landmarks: { x: number; y: number; z: number }[];
    validFrames: number;
    rejectCounts: Record<string, number>;
  }) => {
    setResult({
      faceType: aggResult.faceType,
      scores: aggResult.scores,
      confidence: aggResult.confidence,
      measurements: aggResult.measurements,
      landmarks: aggResult.landmarks,
    });
    setValidFrames(aggResult.validFrames);
    setRejectCounts(aggResult.rejectCounts);
    setPhase("result");
  }, []);

  /** キャプチャ画像を受け取る */
  const handleCapture = useCallback(async (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageUrl(dataUrl);
    setCapturedSize({ width: canvas.width, height: canvas.height });

    // 集約結果がすでにセットされている場合はスキップ（集約モード）
    if (phase === "result" || result) return;

    // フォールバック: 単発解析（MediaPipeが使えない場合）
    setPhase("analyzing");
    setError(null);

    try {
      const { landmarks, measurements } = await analyzeFace(canvas);
      const { scores, faceType, confidence } = calculateScores(measurements);

      setResult({ faceType, scores, confidence, measurements, landmarks });
      setValidFrames(1);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析に失敗しました");
      setPhase("camera");
    }
  }, [phase, result]);

  const handleApplyResult = useCallback(() => {
    if (!result) return;
    const counselingId = FACE_TYPE_TO_COUNSELING_ID[result.faceType];
    onResult(counselingId);
    onOpenChange(false);
  }, [result, onResult, onOpenChange]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setImageUrl("");
    setCapturedSize({ width: 480, height: 360 });
    setError(null);
    setValidFrames(0);
    setRejectCounts({});
    setPhase("camera");
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setPhase("camera");
        setResult(null);
        setImageUrl("");
        setCapturedSize({ width: 480, height: 360 });
        setError(null);
        setValidFrames(0);
        setRejectCounts({});
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const isLowConfidence = result ? result.confidence < CONFIDENCE_THRESHOLD : false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {phase === "camera" && "顔型をカメラで診断"}
            {phase === "analyzing" && "解析中..."}
            {phase === "result" && "診断結果"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {phase === "camera" && (
          <Camera
            onCapture={handleCapture}
            onAggregatedResult={handleAggregatedResult}
          />
        )}

        {phase === "analyzing" && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">顔を解析しています...</p>
          </div>
        )}

        {phase === "result" && result && (
          <div className="space-y-4">
            <FaceMeshOverlay
              imageUrl={imageUrl}
              landmarks={result.landmarks}
              width={capturedSize.width}
              height={capturedSize.height}
            />

            <div className="text-center">
              <p className="text-lg font-bold">
                あなたの顔型は「{FACE_TYPE_LABELS[result.faceType]}」です
              </p>

              {/* 信頼度表示 */}
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">信頼度</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLowConfidence ? "bg-amber-400" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(result.confidence, 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${isLowConfidence ? "text-amber-600" : "text-primary"}`}>
                  {result.confidence}%
                </span>
              </div>

              {validFrames > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {validFrames}フレーム集約
                </p>
              )}
            </div>

            {/* 信頼度が低い場合: 判定保留 */}
            {isLowConfidence && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-bold text-amber-700 mb-1">
                  判定保留 — 再撮影をお願いします
                </p>
                <p className="text-amber-600 text-xs leading-relaxed">
                  上位の顔型が僅差のため、確定できませんでした。
                  {rejectCounts.low_light > 0 && "暗さが影響している可能性があります。"}
                  {rejectCounts.pose_tilt > 0 && "顔の傾きが影響している可能性があります。"}
                  {rejectCounts.small_face > 0 && "顔が小さく映っている可能性があります。"}
                  下記を改善して撮り直してください：
                </p>
                <ul className="text-amber-600 text-xs mt-1 space-y-0.5 list-disc list-inside">
                  {rejectCounts.low_light > 0 && <li>明るい場所で撮影する</li>}
                  {rejectCounts.pose_tilt > 0 && <li>正面をまっすぐ向く</li>}
                  {rejectCounts.small_face > 0 && <li>カメラにもう少し近づく</li>}
                  <li>前髪を分けて額を出す</li>
                  <li>顔全体がガイド枠に収まるようにする</li>
                </ul>
              </div>
            )}

            <ResultChart scores={result.scores} faceType={result.faceType} />

            <div className="flex gap-3 pt-2">
              {isLowConfidence ? (
                /* 判定保留: 再撮影のみ。onResultを呼ばない */
                <Button onClick={handleRetry} className="flex-1">
                  撮り直す
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleRetry} className="flex-1">
                    撮り直す
                  </Button>
                  <Button onClick={handleApplyResult} className="flex-1">
                    この結果を使う
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
