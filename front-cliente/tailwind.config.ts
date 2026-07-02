import type { Config } from "tailwindcss";

const config: Config = {
  presets: [require("@cabana/shared/tailwind-preset.cjs")],
  content: [
    "./src/**/*.{ts,tsx}",
    // componentes compartilhados (se vierem do pacote shared no futuro)
    "../shared/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
