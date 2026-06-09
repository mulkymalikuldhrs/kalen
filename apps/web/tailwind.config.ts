import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        kalen: {
          bg: "#0B0F1A",
          surface: "#111827",
          "surface-2": "#1F2937",
          "surface-3": "#374151",
          border: "#1F2937",
          "border-light": "#374151",
          primary: "#3B82F6",
          "primary-hover": "#2563EB",
          accent: "#F59E0B",
          "accent-hover": "#D97706",
          text: "#F9FAFB",
          "text-secondary": "#9CA3AF",
          "text-muted": "#6B7280",
          success: "#10B981",
          error: "#EF4444",
          warning: "#F59E0B",
          agent: "#8B5CF6",
          "agent-bg": "rgba(139, 92, 246, 0.1)",
          "agent-border": "rgba(139, 92, 246, 0.3)",
          human: "#3B82F6",
          "human-bg": "rgba(59, 130, 246, 0.1)",
          "human-border": "rgba(59, 130, 246, 0.3)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typing": "typing 1.4s infinite ease-in-out",
      },
      keyframes: {
        typing: {
          "0%, 60%, 100%": { opacity: "0.3" },
          "30%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
