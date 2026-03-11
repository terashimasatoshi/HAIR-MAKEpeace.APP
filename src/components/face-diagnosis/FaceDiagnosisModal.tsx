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
import { DiagnosisResult, FaceType, FACE_TYPE_LABELS } from "@/types/face";

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
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async (canvas: HTMLCanvasElement) => {
    setPhase("analyzing");
    setError(null);

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setImageUrl(dataUrl);

      const { landmarks, measurements } = await analyzeFace(canvas);
      const { scores, faceType } = calculateScores(measurements);

      setResult({ faceType, scores, measurements, landmarks });
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析に失敗しました");
      setPhase("camera");
    }
  }, []);

  const handleApplyResult = useCallback(() => {
    if (!result) return;
    const counselingId = FACE_TYPE_TO_COUNSELING_ID[result.faceType];
    onResult(counselingId);
    onOpenChange(false);
  }, [result, onResult, onOpenChange]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setImageUrl("");
    setError(null);
    setPhase("camera");
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // モーダルを閉じるときにリセット
        setPhase("camera");
        setResult(null);
        setImageUrl("");
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

        {phase === "camera" && <Camera onCapture={handleCapture} />}

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
              width={480}
              height={360}
            />

            <div className="text-center">
              <p className="text-lg font-bold">
                あなたの顔型は「{FACE_TYPE_LABELS[result.faceType]}」です
              </p>
            </div>

            <ResultChart scores={result.scores} faceType={result.faceType} />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                撮り直す
              </Button>
              <Button onClick={handleApplyResult} className="flex-1">
                この結果を使う
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
