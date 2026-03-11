"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FaceGuideOverlay } from "./FaceGuideOverlay";

interface CameraProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
}

export function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

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
      } catch {
        if (mounted) {
          setError(
            "カメラにアクセスできません。カメラの使用を許可してください。"
          );
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

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
        {isReady && <FaceGuideOverlay />}
      </div>

      <p className="text-muted-foreground text-sm text-center">
        顔をガイド枠に合わせてください
      </p>

      <Button
        onClick={handleCapture}
        disabled={!isReady}
        size="lg"
        className="min-w-[200px]"
      >
        撮影する
      </Button>
    </div>
  );
}
