/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#07070e',
          50: '#0d0d1a',
          100: '#111122',
          200: '#16162d',
          300: '#1e1e38',
          400: '#262644',
        },
        accent: {
          violet: '#7c3aed',
          indigo: '#6366f1',
          cyan: '#06b6d4',
          orange: '#f97316',
          pink: '#ec4899',
        },
        platform: {
          facebook: '#1877F2',
          instagram: '#E4405F',
          linkedin: '#0A66C2',
          tiktok: '#ff0050',
          google: '#4285F4',
          stories: '#FF6B35',
        },
        status: {
          draft: '#f59e0b',
          approved: '#3b82f6',
          scheduled: '#8b5cf6',
          published: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-violet': 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(6,182,212,0.1) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
