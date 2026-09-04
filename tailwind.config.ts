import type { Config } from "tailwindcss";

/**
 * "Plan View" — tokens are defined as HSL channel triplets in app/globals.css
 * and consumed here so every colour is themeable and nothing is hardcoded in
 * component files. Alpha-capable via the `<alpha-value>` placeholder.
 */
const withAlpha = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withAlpha("--background"),
        foreground: withAlpha("--foreground"),
        surface: {
          DEFAULT: withAlpha("--surface"),
          raised: withAlpha("--surface-raised"),
          sunken: withAlpha("--surface-sunken"),
        },
        card: {
          DEFAULT: withAlpha("--card"),
          foreground: withAlpha("--card-foreground"),
        },
        popover: {
          DEFAULT: withAlpha("--popover"),
          foreground: withAlpha("--popover-foreground"),
        },
        primary: {
          DEFAULT: withAlpha("--primary"),
          foreground: withAlpha("--primary-foreground"),
          hover: withAlpha("--primary-hover"),
          subtle: withAlpha("--primary-subtle"),
          border: withAlpha("--primary-border"),
        },
        secondary: {
          DEFAULT: withAlpha("--secondary"),
          foreground: withAlpha("--secondary-foreground"),
        },
        muted: {
          DEFAULT: withAlpha("--muted"),
          foreground: withAlpha("--muted-foreground"),
        },
        faint: withAlpha("--faint"),
        accent: {
          DEFAULT: withAlpha("--accent"),
          foreground: withAlpha("--accent-foreground"),
        },
        destructive: {
          DEFAULT: withAlpha("--destructive"),
          foreground: withAlpha("--destructive-foreground"),
        },

        // Semantic states — each carries a foreground, a wash and a border so
        // status can be shown as icon + label + tone, never hue alone.
        success: {
          DEFAULT: withAlpha("--success"),
          subtle: withAlpha("--success-subtle"),
          border: withAlpha("--success-border"),
        },
        warning: {
          DEFAULT: withAlpha("--warning"),
          subtle: withAlpha("--warning-subtle"),
          border: withAlpha("--warning-border"),
        },
        danger: {
          DEFAULT: withAlpha("--danger"),
          subtle: withAlpha("--danger-subtle"),
          border: withAlpha("--danger-border"),
        },
        info: {
          DEFAULT: withAlpha("--info"),
          subtle: withAlpha("--info-subtle"),
          border: withAlpha("--info-border"),
        },
        neutral: {
          DEFAULT: withAlpha("--neutral"),
          subtle: withAlpha("--neutral-subtle"),
          border: withAlpha("--neutral-border"),
        },

        // Occupancy states are their own scale: "occupied" is a fact, not a
        // success or a failure, so it must not borrow the semantic palette.
        occupied: {
          DEFAULT: withAlpha("--occ-occupied"),
          bg: withAlpha("--occ-occupied-bg"),
        },
        available: {
          DEFAULT: withAlpha("--occ-available"),
          bg: withAlpha("--occ-available-bg"),
        },
        maintenance: {
          DEFAULT: withAlpha("--occ-maintenance"),
          bg: withAlpha("--occ-maintenance-bg"),
        },
        inactive: {
          DEFAULT: withAlpha("--occ-inactive"),
          bg: withAlpha("--occ-inactive-bg"),
        },

        border: {
          DEFAULT: withAlpha("--border"),
          strong: withAlpha("--border-strong"),
        },
        input: withAlpha("--input"),
        ring: withAlpha("--ring"),

        chart: {
          "1": withAlpha("--chart-1"),
          "2": withAlpha("--chart-2"),
          "3": withAlpha("--chart-3"),
          "4": withAlpha("--chart-4"),
          "5": withAlpha("--chart-5"),
        },
        sidebar: {
          DEFAULT: withAlpha("--sidebar-background"),
          foreground: withAlpha("--sidebar-foreground"),
          heading: withAlpha("--sidebar-heading"),
          primary: withAlpha("--sidebar-primary"),
          "primary-foreground": withAlpha("--sidebar-primary-foreground"),
          accent: withAlpha("--sidebar-accent"),
          "accent-foreground": withAlpha("--sidebar-accent-foreground"),
          border: withAlpha("--sidebar-border"),
          ring: withAlpha("--sidebar-ring"),
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      // Compact, desktop-first scale. Headings are deliberately close in size —
      // hierarchy comes from weight, colour and rules, not from scale jumps.
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.375rem" }],
        md: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.5rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "1.9rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.375rem", { lineHeight: "2.75rem" }],
        "5xl": ["3rem", { lineHeight: "3.25rem" }],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 3px)",
      },

      borderWidth: {
        hairline: "1px",
      },

      boxShadow: {
        raised: "var(--shadow-raised)",
        overlay: "var(--shadow-overlay)",
        none: "none",
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
        // Overlays enter with a short fade + 4px travel. Enough to show
        // direction of origin, not enough to be a performance.
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Used by skeletons — a slow sweep rather than a pulsing opacity,
        // which reads as "loading" instead of "broken".
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.16s ease-out",
        "accordion-up": "accordion-up 0.16s ease-out",
        "fade-in": "fade-in 0.12s ease-out",
        "slide-up": "slide-up 0.14s cubic-bezier(0.2, 0, 0.2, 1)",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
