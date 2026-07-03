/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F2EC',
        section: '#EDE9E3',
        card: '#FFFFFF',
        'card-muted': '#FAFAF8',
        ink: {
          DEFAULT: '#18181B',
          secondary: '#3F3F46',
          muted: '#71717A',
          inverse: '#FAFAFA',
        },
        btc: {
          orange: '#F7931A',
          'orange-deep': '#E07B0F',
          'orange-soft': '#FFF7ED',
        },
        status: {
          green: '#16A34A',
          amber: '#D97706',
          red: '#DC2626',
        },
        nostr: {
          violet: '#7C3AED',
          'violet-soft': '#F5F3FF',
        },
        mp: {
          DEFAULT: '#D6D3D1',
          strong: '#A8A29E',
        },
        /* legacy aliases — migrate to tokens above */
        sovereign: {
          black: '#18181B',
          void: '#FFFFFF',
          silver: '#71717A',
        },
        freedom: { white: '#18181B' },
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
        card: '0 1px 3px rgba(24,24,27,0.08), 0 1px 2px rgba(24,24,27,0.04)',
        'card-hover': '0 12px 32px rgba(24,24,27,0.12), 0 4px 8px rgba(247,147,26,0.08)',
        header: '0 1px 0 rgba(24,24,27,0.06), 0 4px 24px rgba(24,24,27,0.04)',
      },
      backgroundImage: {
        'gradient-radial-soft': 'radial-gradient(ellipse at top, rgba(247,147,26,0.08) 0%, transparent 55%)',
        'gradient-hero-fade': 'linear-gradient(180deg, rgba(245,242,236,0.72) 0%, rgba(245,242,236,0.95) 45%, #F5F2EC 100%)',
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