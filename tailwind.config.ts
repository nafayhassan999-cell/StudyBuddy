import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Dark theme colors
        "dark-bg": "#0a0a0a",
        "dark-card": "#1a1a1a",
        "dark-border": "#2a2a2a",
        "dark-accent": "#6b7280",
        // White theme colors
        "white-bg": "#ffffff",
        "white-card": "#f8f9fa",
        "white-border": "#e2e8f0",
        "white-accent": "#4b5563",
        // Ocean theme colors
        "ocean-bg": "#0c1e2e",
        "ocean-card": "#1a3a52",
        "ocean-border": "#2d5f7f",
        "ocean-accent": "#06b6d4",
        "ocean-light": "#67e8f9",
        // Forest theme colors
        "forest-bg": "#0f1e13",
        "forest-card": "#1a2e20",
        "forest-border": "#2d4a35",
        "forest-accent": "#10b981",
        "forest-light": "#6ee7b7",
      },
    },
  },
  plugins: [
    function ({ addVariant }: any) {
      addVariant("dark", ".dark &");
      addVariant("white", ".white &");
      addVariant("ocean", ".ocean &");
      addVariant("forest", ".forest &");
    },
  ],
};
export default config;
