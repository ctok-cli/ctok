import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b0d12",
          elevated: "#11141b",
          subtle: "#161a23",
        },
        border: {
          DEFAULT: "#222633",
          subtle: "#1a1e29",
        },
        text: {
          DEFAULT: "#e6e8ee",
          muted: "#9aa0ad",
          dim: "#6c7280",
        },
        accent: {
          DEFAULT: "#c97a3a",
          subtle: "#3a2618",
        },
        ok: "#4ade80",
        warn: "#fbbf24",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas"],
      },
    },
  },
  plugins: [],
};

export default config;
