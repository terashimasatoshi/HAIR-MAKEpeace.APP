"use client";

import { FaceScores, FaceType, FACE_TYPE_LABELS } from "@/types/face";

interface ResultChartProps {
  scores: FaceScores;
  faceType: FaceType;
}

const FACE_TYPES: FaceType[] = ["round", "oval", "long", "base"];

export function ResultChart({ scores, faceType }: ResultChartProps) {
  return (
    <div className="space-y-3">
      {FACE_TYPES.map((type) => {
        const isMax = type === faceType;
        return (
          <div key={type} className="flex items-center gap-3">
            <span
              className={`w-[4.5rem] text-right text-sm ${
                isMax ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {FACE_TYPE_LABELS[type]}
            </span>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isMax ? "bg-primary" : "bg-primary/40"
                }`}
                style={{ width: `${scores[type]}%` }}
              />
            </div>
            <span
              className={`w-12 text-right tabular-nums text-sm ${
                isMax ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {scores[type]}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
