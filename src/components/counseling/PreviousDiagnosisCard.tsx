"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DiagnosisCustomer = {
  face_shape?: string | null;
  personal_color?: string | null;
  personal_color_type?: string | null;
};

const FACE_SHAPE_LABELS: Record<string, string> = {
  egg: "卵型",
  oval: "卵型",
  round: "丸型",
  base: "ベース型",
  square: "ベース型",
  triangle: "逆三角形",
  heart: "逆三角形",
  long: "面長",
  oblong: "面長",
};

const COLOR_SEASON_LABELS: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

const COLOR_BASE_LABELS: Record<string, string> = {
  warm: "イエベ",
  yellowbase: "イエベ",
  cool: "ブルベ",
  bluebase: "ブルベ",
};

export function PreviousDiagnosisCard({
  customer,
  onEdit,
}: {
  customer: DiagnosisCustomer;
  onEdit: () => void;
}) {
  const faceShapeLabel = customer.face_shape
    ? FACE_SHAPE_LABELS[customer.face_shape] || customer.face_shape
    : "未設定";

  const baseLabel = customer.personal_color_type
    ? COLOR_BASE_LABELS[customer.personal_color_type] || customer.personal_color_type
    : "";
  const seasonLabel = customer.personal_color
    ? COLOR_SEASON_LABELS[customer.personal_color] || customer.personal_color
    : "";
  const personalColorLabel = baseLabel || seasonLabel
    ? `${baseLabel}${seasonLabel}`
    : "未設定";

  return (
    <Card className="mb-4 bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-green-800">👤 前回の診断情報</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-green-700 text-xs hover:text-green-800"
          >
            修正する
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500">顔型</span>
            <p className="font-medium">{faceShapeLabel}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">パーソナルカラー</span>
            <p className="font-medium">{personalColorLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

