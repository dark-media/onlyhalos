import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Core brand palette ────────────────────────────── */
        halo: {
          gold:       "#FFC700",
          "gold-light": "#FFD740",
          "gold-dark":  "#E0AF00",
          "gold-muted": "#B8941A",
          amber:      "#FFAB00",
          bronze:     "#CD7F32",
          cream:      "#FFF8E1",
        },

        dark: {
          DEFAULT:    "#0F0F13",
          50:         "#1A1A22",
          100:        "#1E1E28",
          200:        "#24242F",
          300:        "#2A2A36",
          400:        "#32323F",
          500:        "#3D3D4A",
          600:        "#4A4A58",
          700:        "#5C5C6B",
          800:        "#7A7A8A",
          900:        "#9E9EAE",
        },

        /* ── Semantic tokens (shadcn/ui compatible) ───────── */
        background:   "hsl(var(--background))",
        foreground:   "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border:       "hsl(var(--border))",
        input:        "hsl(var(--input))",
        ring:         "hsl(var(--ring))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        /* ── Status colors ────────────────────────────────── */
        success: {
          DEFAULT:    "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT:    "#FFAB00",
          foreground: "#0F0F13",
        },
        info: {
          DEFAULT:    "#3B82F6",
          foreground: "#FFFFFF",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        "halo-spin": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 2s linear infinite",
        "glow-pulse":     "glow-pulse 2s ease-in-out infinite",
        "halo-spin":      "halo-spin 3s linear infinite",
      },

      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #FFC700 0%, #FFD740 50%, #E0AF00 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #0F0F13 0%, #1A1A22 50%, #1E1E28 100%)",
        "card-gradient":
          "linear-gradient(180deg, #1E1E28 0%, #1A1A22 100%)",
      },

      boxShadow: {
        "gold-sm":  "0 1px 3px rgba(255, 199, 0, 0.12)",
        "gold-md":  "0 4px 14px rgba(255, 199, 0, 0.18)",
        "gold-lg":  "0 10px 40px rgba(255, 199, 0, 0.25)",
        "gold-glow": "0 0 20px rgba(255, 199, 0, 0.35)",
        "dark-lg":  "0 10px 40px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
