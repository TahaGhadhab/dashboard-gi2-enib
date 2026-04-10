/** @type {import('tailwindcss').Config} */

const config = {
  darkMode: ["class"],
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
        background: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        "primary-text": "var(--text-primary)",
        "secondary-text": "var(--text-secondary)",
        "muted-text": "var(--text-muted)",
        "inverse-text": "var(--text-inverse)",
        
        accent: {
          blue: "var(--accent-blue)",
          teal: "var(--accent-teal)",
          amber: "var(--accent-amber)",
          red: "var(--accent-red)",
          purple: "var(--accent-purple)",
        },
        
        glow: {
          blue: "var(--accent-blue-glow)",
          teal: "var(--accent-teal-glow)",
          amber: "var(--accent-amber-glow)",
          red: "var(--accent-red-glow)",
        },

        kpi: {
          ok: "var(--kpi-ok)",
          warning: "var(--kpi-warning)",
          danger: "var(--kpi-danger)",
          neutral: "var(--kpi-neutral)",
        },

        /* Shadcn compat */
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
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
