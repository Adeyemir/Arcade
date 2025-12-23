
import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#F8FAFC", // Slate Mist
        foreground: "#0F172A", // Midnight
        primary: {
          DEFAULT: "#2563EB", // Electric Blue
          foreground: "#FFFFFF", // Pure White
        },
        secondary: {
          DEFAULT: "#F8FAFC", // Slate Mist
          foreground: "#0F172A", // Midnight
        },
        destructive: {
          DEFAULT: "#EF4444", // Rose
          foreground: "#FFFFFF", // Pure White
        },
        muted: {
          DEFAULT: "#64748B", // Steel
          foreground: "#FFFFFF", // Pure White
        },
        accent: {
          DEFAULT: "#F8FAFC", // Slate Mist
          foreground: "#0F172A", // Midnight
        },
        popover: {
          DEFAULT: "#FFFFFF", // Pure White
          foreground: "#0F172A", // Midnight
        },
        card: {
          DEFAULT: "#FFFFFF", // Pure White
          foreground: "#0F172A", // Midnight
        },
        success: {
          DEFAULT: "#10B981", // Emerald
          foreground: "#FFFFFF", // Pure White
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
} satisfies Config

export default config
