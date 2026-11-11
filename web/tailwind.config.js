/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

// Students Academy brand: white and red.
// The UI was written with blue / cyan / indigo / violet / navy / gold class names; they are remapped
// here so the whole site and portal follow the red theme from one place.
const crimson = { 50: '#fff1f2', 100: '#ffe1e3', 200: '#fec8cc', 300: '#fca5ab', 400: '#f6707a', 500: '#e11d2e', 600: '#c8102e', 700: '#a50d25', 800: '#880f22', 900: '#701221', 950: '#3f040e' }
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#fef2f2', 100: '#fde3e3', 200: '#f9c4c4', 300: '#f19a9a', 400: '#e26464', 500: '#c42020', 600: '#a11616', 700: '#821216', 800: '#6a0f14', 900: '#4c0a0f', 950: '#2c0508' },
        gold: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#fb7f7f', 500: '#e11d1d', 600: '#c81818', 700: '#a51414' },
        brand: colors.red,
        red: colors.red, blue: colors.red, sky: colors.red, cyan: colors.red,
        indigo: crimson, violet: crimson, purple: crimson, fuchsia: colors.rose,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        heading: ['Sora', 'Inter', 'sans-serif'],
        body: ['Manrope', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.08)',
        clay: '0 8px 30px rgba(220,38,38,0.07)',
        glass: '0 24px 60px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
        topbar: '0 18px 40px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
      },
      keyframes: {
        'float-slow': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shine: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        aurora: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '33%': { transform: 'translate(30px,-40px) scale(1.08)' }, '66%': { transform: 'translate(-25px,20px) scale(0.95)' } },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        shine: 'shine 6s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        aurora: 'aurora 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
