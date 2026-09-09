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
        encontrada: {
          50: '#fbf7f0',
          100: '#f5ecd8',
          200: '#ebdab1',
          300: '#dfc282',
          400: '#d4aa58',
          500: '#c59138', // Dorado/Cálido rústico
          600: '#ab742c',
          700: '#895626',
          800: '#714624',
          900: '#5e3a21',
          950: '#351e10',
        },
      },
    },
  },
  plugins: [],
};
export default config;
