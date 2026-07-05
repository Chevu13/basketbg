import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          400: '#FF8A33',
          500: '#FF6B00',
          600: '#E65F00',
          700: '#CC5400',
        },
        court: {
          bg: '#0C0C0E',
          card: '#161618',
          card2: '#1C1C1F',
          border: '#1D1D1F',
          muted: '#242428',
          text: '#8E8E93',
          text2: '#5C5C60',
        },
      },
      fontFamily: {
        display: ['var(--font-barlow)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'live-pip': 'livePip 2s ease-in-out infinite',
        'map-pulse': 'mapPulse 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 0, 0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(255, 107, 0, 0.15)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        ping: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        livePip: {
          '0%, 100%': { transform: 'scale(1)', opacity: '.8' },
          '60%': { transform: 'scale(2.2)', opacity: '0' },
        },
        mapPulse: {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1)', opacity: '.7' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.5)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
