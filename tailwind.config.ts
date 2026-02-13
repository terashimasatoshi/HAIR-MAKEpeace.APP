import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // プライマリカラー（ウォームブラウン）
        primary: {
          DEFAULT: "#8B7355",
          light: "#A89078",
          dark: "#6B5744",
        },
        // アクセントカラー（ゴールドベージュ）
        accent: {
          DEFAULT: "#D4A574",
          light: "#E8C9A0",
        },
        // セマンティックカラー
        success: "#4CAF50",
        warning: "#FF9800",
        error: "#F44336",
        info: "#2196F3",
        // ニュートラル
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "text-primary": "#333333",
        "text-secondary": "#666666",
        border: "#E0E0E0",
        // ダメージレベル表示用
        "damage-1": "#4CAF50",
        "damage-2": "#8BC34A",
        "damage-3": "#FFC107",
        "damage-4": "#FF9800",
        "damage-5": "#F44336",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
