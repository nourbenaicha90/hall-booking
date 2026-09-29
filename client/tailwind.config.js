/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14100C', 800: '#1E1812', 700: '#2A2219', 600: '#3A3025' },
        gold: { DEFAULT: '#C9A45C', light: '#E4CB8F', deep: '#9A7A34' },
        ivory: { DEFAULT: '#FAF6EC', dark: '#EFE7D4' },
        wine: '#7A2A3A',
      },
      fontFamily: {
        display: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        body: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
