/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Mobile-first font sizes with responsive scaling
        'xs': ['0.6875rem', { lineHeight: '1rem' }],      // 11px mobile
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px mobile
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],  // 15px mobile
        'lg': ['1.0625rem', { lineHeight: '1.75rem' }],   // 17px mobile
        'xl': ['1.1875rem', { lineHeight: '1.75rem' }],   // 19px mobile
        '2xl': ['1.375rem', { lineHeight: '2rem' }],      // 22px mobile
        '3xl': ['1.75rem', { lineHeight: '2.25rem' }],    // 28px mobile
        '4xl': ['2rem', { lineHeight: '2.5rem' }],        // 32px mobile
        '5xl': ['2.5rem', { lineHeight: '1' }],           // 40px mobile
        '6xl': ['3rem', { lineHeight: '1' }],             // 48px mobile
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
