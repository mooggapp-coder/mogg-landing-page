import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Barlow Condensed", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
      spacing: {
        /* Design-system aliases (8 / 16 / 24 / 32 / 48) */
        ds: "8px",
        "ds-1": "8px",
        "ds-2": "16px",
        "ds-3": "24px",
        "ds-4": "32px",
        "ds-5": "48px",
      },
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
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: "hsl(var(--gold))",
        silver: "hsl(var(--silver))",
        bronze: "hsl(var(--bronze))",
        "surface-alt": "hsl(var(--surface-alt))",
        "surface-dark": "hsl(var(--surface-dark))",
        "surface-dark-fg": "hsl(var(--surface-dark-fg))",
      },
      borderRadius: {
        /* One radius everywhere — lg/md/sm/xl all resolve to --radius */
        DEFAULT: "var(--radius)",
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius)",
        xl: "var(--radius)",
        "2xl": "var(--radius)",
      },
      boxShadow: {
        "primary-glow": "0 0 24px hsl(var(--primary) / 0.35)",
        "primary-glow-sm": "0 0 16px hsl(var(--primary) / 0.25)",
      },
      height: {
        "btn-primary": "var(--btn-primary-h)",
        "btn-secondary": "var(--btn-secondary-h)",
      },
      minHeight: {
        "btn-primary": "var(--btn-primary-h)",
        "btn-secondary": "var(--btn-secondary-h)",
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
} satisfies Config;
