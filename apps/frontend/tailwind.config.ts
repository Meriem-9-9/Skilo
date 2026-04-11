import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{ts,tsx}', 
  ],
  theme: {
    extend: {
      colors: {
        // Palette SkillSwap — Option C Violet & Citron
        violet: {
          DEFAULT: '#6D28D9',
          2: '#7C3AED',
        },
        citron: {
          DEFAULT: '#D4F000',
          hover: '#C8E800',
        },
        dark: {
          DEFAULT: '#1C1033',
        },
        bg: {
          DEFAULT: '#F5F3FF',
        },
        surface: {
          DEFAULT: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#8B7EA8',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        card: '0 4px 6px rgba(109,40,217,.04), 0 12px 40px rgba(109,40,217,.10), 0 0 0 1px rgba(109,40,217,.08)',
        'card-lg': '0 20px 80px rgba(109,40,217,.25), 0 0 0 1px rgba(109,40,217,.08)',
        'violet-glow': '0 8px 30px rgba(109,40,217,.3)',
        'citron-glow': '0 8px 30px rgba(212,240,0,.3)',
        'btn-hover': '0 6px 20px rgba(109,40,217,.25)',
      },
      animation: {
        'fade-up': 'fadeUp .5s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fadeIn .5s ease both',
        'float': 'float 4s ease-in-out infinite',
        'pop': 'pop .4s cubic-bezier(.34,1.56,.64,1) both',
        'spin-slow': 'spin .6s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pop: {
          from: { transform: 'scale(0)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
