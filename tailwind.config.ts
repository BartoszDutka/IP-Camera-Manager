import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f6f8",
          100: "#e4e9ee",
          200: "#c8d2dc",
          300: "#9aabbc",
          400: "#6b8096",
          500: "#4f647a",
          600: "#3d4f61",
          700: "#334050",
          800: "#2c3643",
          900: "#1e2630",
          950: "#121820",
        },
        signal: {
          DEFAULT: "#0d9488",
          light: "#2dd4bf",
          dark: "#0f766e",
        },
        warn: "#e8a838",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 20px 50px -24px rgba(18, 24, 32, 0.45)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(ellipse at top left, rgba(13,148,136,0.12), transparent 50%), linear-gradient(165deg, #f4f6f8, #e8eef2 50%, #dce6ec)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseLive: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.85)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease-out both",
        "pulse-live": "pulseLive 1.6s ease-in-out infinite",
        "slide-in": "slideIn 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
