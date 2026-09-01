import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f5",
          100: "#efeeec",
          200: "#e3e2df",
          300: "#cfcecb",
          400: "#a1a09c",
          500: "#787774",
          600: "#4f4d49",
          700: "#37352f",
          800: "#25231e",
          900: "#191712",
        },
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "Pretendard",
          "Malgun Gothic",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(124, 58, 237, 0.12)",
        card: "0 2px 12px -2px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
