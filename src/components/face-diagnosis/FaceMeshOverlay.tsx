"use client";

import { useRef, useEffect } from "react";

interface FaceMeshOverlayProps {
  imageUrl: string;
  landmarks: { x: number; y: number; z: number }[];
  width: number;
  height: number;
}

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
  378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109, 10,
];

export function FaceMeshOverlay({
  imageUrl,
  landmarks,
  width,
  height,
}: FaceMeshOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.drawImage(img, 0, 0, width, height);

      ctx.fillStyle = "rgba(201, 169, 110, 0.5)";
      for (const lm of landmarks) {
        const x = lm.x * width;
        const y = lm.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(201, 169, 110, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < FACE_OVAL.length; i++) {
        const lm = landmarks[FACE_OVAL[i]];
        const x = lm.x * width;
        const y = lm.y * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(107, 142, 107, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);

      drawLine(ctx, landmarks[234], landmarks[454], width, height);
      drawLine(ctx, landmarks[9], landmarks[152], width, height);
      drawLine(ctx, landmarks[172], landmarks[397], width, height);
    };
    img.src = imageUrl;
  }, [imageUrl, landmarks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto rounded-xl"
      style={{ maxWidth: width }}
    />
  );
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  w: number,
  h: number
) {
  ctx.beginPath();
  ctx.moveTo(a.x * w, a.y * h);
  ctx.lineTo(b.x * w, b.y * h);
  ctx.stroke();
}
