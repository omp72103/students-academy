/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f1f5fb', 100: '#dde6f3', 200: '#b9cbe6', 500: '#2f5597', 600: '#1f3f78', 700: '#17305d', 800: '#102445', 900: '#0b1a33' },
        gold: { 50: '#fdf8ec', 100: '#f8ecc9', 400: '#d9ad4f', 500: '#c8962e', 600: '#a77a1f' },
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.08)' },
    },
  },
  plugins: [],
}
