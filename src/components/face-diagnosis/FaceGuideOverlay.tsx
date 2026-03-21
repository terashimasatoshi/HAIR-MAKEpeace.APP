"use client";

import { useRef, useEffect } from "react";

interface FaceGuideOverlayProps {
  faceDetected?: boolean;
}

export function FaceGuideOverlay({ faceDetected }: FaceGuideOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectedRef = useRef(faceDetected);
  faceDetectedRef.current = faceDetected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw(canvas, faceDetectedRef.current);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) draw(canvas, faceDetected);
  }, [faceDetected]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

function draw(canvas: HTMLCanvasElement, faceDetected?: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  const ellipseW = w * 0.38;
  const ellipseH = h * 0.52;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // 暗いオーバーレイ
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, w, h);

  // 楕円の中をくり抜く
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, ellipseW, ellipseH, 0, 0, Math.PI * 2);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fill();
  ctx.restore();

  // 楕円の枠（顔検出状態で色が変わる）
  const borderColor =
    faceDetected === undefined
      ? "rgba(255, 255, 255, 0.8)"
      : faceDetected
        ? "rgba(34, 197, 94, 0.9)"
        : "rgba(239, 68, 68, 0.7)";

  ctx.beginPath();
  ctx.ellipse(cx, cy, ellipseW, ellipseH, 0, 0, Math.PI * 2);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(faceDetected === undefined ? [8, 6] : []);
  ctx.stroke();
  ctx.setLineDash([]);

  // ガイドライン3本（目・鼻・口の位置）
  const guideColor = "rgba(255, 255, 255, 0.3)";
  ctx.strokeStyle = guideColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const eyeY = cy - ellipseH * 0.2;      // 上から約40%
  const noseY = cy;                        // 中央
  const mouthY = cy + ellipseH * 0.3;     // 下から約30%

  [eyeY, noseY, mouthY].forEach((lineY) => {
    // 楕円内のみ線を引く（楕円の方程式から水平幅を算出）
    const dy = lineY - cy;
    const ratio = 1 - (dy * dy) / (ellipseH * ellipseH);
    if (ratio <= 0) return;
    const halfWidth = ellipseW * Math.sqrt(ratio);

    ctx.beginPath();
    ctx.moveTo(cx - halfWidth + 8, lineY);
    ctx.lineTo(cx + halfWidth - 8, lineY);
    ctx.stroke();
  });

  // ガイドラインラベル
  ctx.setLineDash([]);
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "right";

  const labelX = cx - ellipseW - 6;
  ctx.fillText("目", labelX + ellipseW * 2 + 20, eyeY + 3);
  ctx.fillText("鼻", labelX + ellipseW * 2 + 20, noseY + 3);
  ctx.fillText("口", labelX + ellipseW * 2 + 20, mouthY + 3);
}
