import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: "#C75D3A",
          light: "#E9D6CC",
          dark: "#A8481F",
        },
        moss: {
          DEFAULT: "#5C6B4F",
          light: "#8a9678",
        },
        gold: "#B68A3A",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          light: "rgb(var(--color-ink-light) / <alpha-value>)",
        },
        line: "rgb(var(--color-line) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        "cream-dim": "rgb(var(--color-cream-dim) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;