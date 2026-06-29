/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#085041',
          mid: '#0F6E56',
          primary: '#1D9E75',
          light: '#E1F5EE',
          gold: '#EF9F27',
        },
        danger: '#e74c3c',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
