/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

// Students Academy brand: navy blue and red on white.
// navy = deep navy (headings, dark sections), blue = primary UI colour, gold = red accent.
// The UI was written with blue / cyan / indigo / violet / navy / gold class names; they are remapped
// here so the whole site and portal follow the brand from one place.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f1f5fb', 100: '#dde6f3', 200: '#b9cbe6', 300: '#8eaad6', 400: '#5d82bf', 500: '#2f5597', 600: '#1f3f78', 700: '#17305d', 800: '#102445', 900: '#0b1a33', 950: '#071122' },
        gold: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#fb7f7f', 500: '#e11d1d', 600: '#c81818', 700: '#a51414' },
        brand: colors.blue,
        red: colors.red, blue: colors.blue, sky: colors.sky, cyan: colors.sky,
        indigo: colors.blue, violet: colors.indigo, purple: colors.indigo, fuchsia: colors.rose,
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
