/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      boxShadow: {
        // Layered ambient soft shadows — never harsh
        soft: '0 2px 8px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06), 0 24px 48px rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(15, 23, 42, 0.09)',
        glow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
        'glow-emerald': '0 0 0 3px rgba(16, 185, 129, 0.15)',
        'inner-highlight': 'inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        'inner-dark': 'inset 0 1px 2px rgba(0, 0, 0, 0.15)',
        'antigravity': '0 20px 40px rgba(0,0,0,0.05)',
        navbar: '0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(15, 23, 42, 0.04)',
      },
      colors: {
        // Brand ink — rich, not flat black
        ink: {
          50: '#f0f4ff',
          100: '#e3eaff',
          200: '#c7d5ff',
          300: '#a0b3ff',
          400: '#7b8aff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#1e1b4b',
          900: '#0f0d2b',
          950: '#07111f',
        },
        // Surface system
        surface: {
          50: '#fafbff',
          100: '#f4f7fe',
          200: '#e8eefb',
        },
      },
      backgroundImage: {
        // Mesh gradients for hero sections
        'mesh-indigo': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        'mesh-emerald': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16,185,129,0.12) 0%, transparent 70%)',
        'mesh-sky': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(56,189,248,0.12) 0%, transparent 70%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.32, 0.72, 0, 1) both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
