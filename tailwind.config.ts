import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  // Tremor setzt Farb-Utility-Klassen zur Laufzeit. Ohne Safelist purged
  // Tailwind sie weg -> Diagramme erscheinen grau. Wir safelisten die
  // Palette, die unsere Charts nutzen.
  safelist: [
    {
      pattern:
        /^(bg|text|fill|stroke|border|ring)-(slate|gray|pink|rose|fuchsia|blue|sky|violet|purple|amber|orange|teal|emerald|green|red|cyan|indigo)-(300|400|500|600|700|800|900)$/,
    },
    {
      pattern:
        /^(bg|text|fill|stroke|border|ring)-(slate|gray|pink|rose|fuchsia|blue|sky|violet|purple|amber|orange|teal|emerald|green|red|cyan|indigo)-(50|100|200)$/,
      variants: ["hover"],
    },
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          text: "hsl(var(--accent-text))",
          hover: "hsl(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // ── Tremor-Farbtokens, an unsere CSS-Variablen gebunden ──
        // Da unsere Variablen bei .dark automatisch umschalten, koennen
        // tremor und dark-tremor dieselben Variablen nutzen -> Achsen,
        // Gitter und Beschriftungen folgen Light/Dark.
        tremor: {
          brand: {
            faint: "hsl(var(--accent) / 0.12)",
            muted: "hsl(var(--accent) / 0.3)",
            subtle: "hsl(var(--accent) / 0.6)",
            DEFAULT: "hsl(var(--accent))",
            emphasis: "hsl(var(--accent-text))",
            inverted: "hsl(var(--accent-foreground))",
          },
          background: {
            muted: "hsl(var(--muted))",
            subtle: "hsl(var(--muted))",
            DEFAULT: "hsl(var(--card))",
            emphasis: "hsl(var(--foreground))",
          },
          border: { DEFAULT: "hsl(var(--border))" },
          ring: { DEFAULT: "hsl(var(--border))" },
          content: {
            subtle: "hsl(var(--muted-foreground))",
            DEFAULT: "hsl(var(--muted-foreground))",
            emphasis: "hsl(var(--foreground))",
            strong: "hsl(var(--foreground))",
            inverted: "hsl(var(--background))",
          },
        },
        "dark-tremor": {
          brand: {
            faint: "hsl(var(--accent) / 0.12)",
            muted: "hsl(var(--accent) / 0.3)",
            subtle: "hsl(var(--accent) / 0.6)",
            DEFAULT: "hsl(var(--accent))",
            emphasis: "hsl(var(--accent-text))",
            inverted: "hsl(var(--accent-foreground))",
          },
          background: {
            muted: "hsl(var(--muted))",
            subtle: "hsl(var(--muted))",
            DEFAULT: "hsl(var(--card))",
            emphasis: "hsl(var(--foreground))",
          },
          border: { DEFAULT: "hsl(var(--border))" },
          ring: { DEFAULT: "hsl(var(--border))" },
          content: {
            subtle: "hsl(var(--muted-foreground))",
            DEFAULT: "hsl(var(--muted-foreground))",
            emphasis: "hsl(var(--foreground))",
            strong: "hsl(var(--foreground))",
            inverted: "hsl(var(--background))",
          },
        },
      },
      boxShadow: {
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.06)",
        "tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
