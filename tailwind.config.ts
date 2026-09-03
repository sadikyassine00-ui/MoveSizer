import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: "#090A0C",
          light: "#F8F9FA",
          DEFAULT: "#090A0C",
        },
        panel: {
          dark: "#111318",
          light: "#FFFFFF",
          DEFAULT: "#111318",
        },
        border: {
          dark: "#1F242F",
          light: "#E2E4E9",
          DEFAULT: "#1F242F",
        },
        primary: {
          DEFAULT: "#FF5500", // Safety Orange
          hover: "#E04B00",
        },
        accent: {
          DEFAULT: "#0066FF", // Electric Blue
          hover: "#0052CC",
        },
        status: {
          optimal: "#10B981", // Green
          caution: "#F59E0B", // Amber
          critical: "#EF4444", // Red
        },
      },
      fontFamily: {
        display: ["var(--font-barlow-condensed)", "sans-serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
