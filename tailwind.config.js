/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#07090e',
          secondary: '#0d111a',
          card: 'rgba(19, 25, 38, 0.75)',
          'card-hover': 'rgba(26, 34, 52, 0.9)',
          elevated: '#161d2d',
        },
        primary: {
          DEFAULT: '#ff5e3a',
          hover: '#ff7352',
          glow: 'rgba(255, 94, 58, 0.35)',
          muted: '#9a3412',
        },
        coral: {
          DEFAULT: '#ff6b57',
          light: '#ff8a7a',
          dark: '#e04835',
        },
        gold: {
          DEFAULT: '#dfa759',
          light: '#f5c685',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.16)',
          accent: 'rgba(255, 94, 58, 0.4)',
        },
        surface: {
          100: '#f8fafc',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 30px -5px rgba(255, 94, 58, 0.3)',
        'glow-accent': '0 0 40px -10px rgba(223, 167, 89, 0.25)',
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'luxury-hover': '0 30px 60px -15px rgba(255, 94, 58, 0.2), 0 0 0 1px rgba(255, 94, 58, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
