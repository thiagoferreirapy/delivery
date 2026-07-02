// Preset Tailwind compartilhado — identidade visual Cabana Lanches.
// Usado pelos 3 fronts via `presets: [require('@cabana/shared/tailwind-preset.cjs')]`.

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6E1423",
          hover: "#8C1C2E",
          light: "#B23A48",
        },
        cream: "#FBF7F2",
        ink: "#1F1B18",
        muted: "#6B6157",
        success: "#2E7D4F",
        warning: "#C97A18",
        danger: "#B3261E",
      },
      fontFamily: {
        // Fonte única: Montserrat em toda a interface (estilo Mercado Livre).
        // `display` mantido como alias para não quebrar classes font-display existentes.
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(31, 27, 24, 0.08)",
        card: "0 1px 3px rgba(31, 27, 24, 0.06), 0 4px 16px rgba(31, 27, 24, 0.05)",
      },
      maxWidth: {
        app: "480px", // container mobile-first
      },
    },
  },
};
