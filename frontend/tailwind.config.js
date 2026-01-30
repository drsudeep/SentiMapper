/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        border: '#e4e4e7',
        input: '#e4e4e7',
        ring: '#18181b',
        background: '#ffffff',
        foreground: '#09090b',
        primary: {
          DEFAULT: '#18181b',
          foreground: '#fafafa'
        },
        secondary: {
          DEFAULT: '#f4f4f5',
          foreground: '#18181b'
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fafafa'
        },
        muted: {
          DEFAULT: '#f4f4f5',
          foreground: '#71717a'
        },
        accent: {
          DEFAULT: '#f4f4f5',
          foreground: '#18181b'
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#09090b'
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#09090b'
        },
        sentiment: {
          positive: '#10b981',
          neutral: '#94a3b8',
          negative: '#ef4444'
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};