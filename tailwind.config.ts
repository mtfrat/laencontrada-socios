import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: "#fdf4f5",
          100: "#fbe8ea",
          200: "#f7d4d8",
          300: "#efb3bb",
          400: "#e18693",
          500: "#cf5c6d",
          600: "#b53d50",
          700: "#8f2233",
          800: "#5c131d", // Color oficial principal
          900: "#3d0b12",
          950: "#220509",
        },
        bistro: {
          canvas: "#010101",
          card: "#0d0708",
          elevated: "#150c0e",
          inset: "#050304",
          border: "rgba(92, 19, 29, 0.35)",
        },
        champagne: {
          light: "#fdfaf7",
          warm: "#f5ede6",
          muted: "#a1908d",
          faint: "#635553",
        },
        gold: {
          points: "#d4aa58",
          glow: "rgba(212, 170, 88, 0.2)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
