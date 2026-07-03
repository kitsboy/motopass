/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--mp-canvas-rgb) / <alpha-value>)',
        section: 'rgb(var(--mp-section-rgb) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--mp-card-rgb) / <alpha-value>)',
          muted: 'rgb(var(--mp-card-muted-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--mp-ink-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--mp-ink-secondary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--mp-ink-muted-rgb) / <alpha-value>)',
          inverse: 'rgb(var(--mp-ink-inverse-rgb) / <alpha-value>)',
        },
        'btc-orange': '#F7931A',
        'btc-orange-deep': '#E07B0F',
        'btc-orange-soft': 'rgb(var(--mp-btc-soft-rgb) / <alpha-value>)',
        status: {
          green: '#16A34A',
          amber: '#D97706',
          red: '#DC2626',
        },
        nostr: {
          violet: '#7C3AED',
          'violet-soft': 'rgb(var(--mp-nostr-soft-rgb) / <alpha-value>)',
        },
        mp: {
          DEFAULT: 'rgb(var(--mp-border-rgb) / <alpha-value>)',
          strong: 'rgb(var(--mp-border-strong-rgb) / <alpha-value>)',
        },
        sovereign: {
          black: 'rgb(var(--mp-ink-rgb) / <alpha-value>)',
          void: 'rgb(var(--mp-card-rgb) / <alpha-value>)',
          silver: 'rgb(var(--mp-ink-muted-rgb) / <alpha-value>)',
        },
        freedom: { white: 'rgb(var(--mp-ink-rgb) / <alpha-value>)' },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'mp-sm': '8px',
        'mp-md': '12px',
        'mp-lg': '16px',
        'mp-xl': '20px',
      },
      boxShadow: {
        card: 'var(--mp-shadow-card)',
        'card-hover': 'var(--mp-shadow-card-hover)',
        header: 'var(--mp-shadow-header)',
      },
      backgroundImage: {
        'gradient-radial-soft': 'var(--mp-gradient-radial)',
        'gradient-hero-fade': 'var(--mp-gradient-hero)',
      },
      animation: {
        'ken-burns': 'ken-burns 28s ease-in-out infinite alternate',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.12) translate(-2%, -1.5%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}