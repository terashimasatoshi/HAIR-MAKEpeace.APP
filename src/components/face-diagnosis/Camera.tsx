"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FaceGuideOverlay } from "./FaceGuideOverlay";
import { initFaceLandmarkerVideo } from "@/lib/face-analysis";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

interface CameraProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
}

export function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | undefined>(undefined);
  const [landmarkerReady, setLandmarkerReady] = useState(false);

  // 顔検出を1回実行
  const detectOnce = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2 || video.paused) return;

    const now = performance.now();
    // タイムスタンプが前回と同じか戻っている場合はスキップ
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
      // カメラを先に起動
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
      } catch {
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
          if (mounted) setIsReady(true);
        };
      }

      // MediaPipeを非同期で初期化（カメラとは独立）
      try {
        const landmarker = await initFaceLandmarkerVideo();
        if (mounted) {
          landmarkerRef.current = landmarker;
          setLandmarkerReady(true);
        }
      } catch (e) {
        console.warn("MediaPipe init failed, camera-only mode:", e);
        // MediaPipeが失敗してもカメラは使える
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

  // カメラとMediaPipeの両方が準備できたら検出ループ開始
  useEffect(() => {
    if (!isReady || !landmarkerReady) return;

    // 200msごとに検出（rAFだと速すぎてタイムスタンプ重複エラーになる）
    timerRef.current = setInterval(detectOnce, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReady, landmarkerReady, detectOnce]);

  const handleCapture = useCallback(() => {
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

  // MediaPipe未初期化の場合はカメラのみで撮影可能にする
  const canCapture = isReady && (landmarkerReady ? !!faceDetected : true);

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
      </div>

      <p className="text-muted-foreground text-sm text-center">
        {!landmarkerReady
          ? "顔をガイド枠に合わせてください"
          : faceDetected
            ? "顔を検出しました。撮影できます"
            : "目を上の線に、あごを枠の下端に合わせてください"}
      </p>

      <Button
        onClick={handleCapture}
        disabled={!canCapture}
        size="lg"
        className="min-w-[200px]"
      >
        撮影する
      </Button>
    </div>
  );
}
