/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#102a43',
          900: '#0b1d30',
          950: '#06101e',
        },
        gold: {
          50: '#fbf9f0',
          100: '#f5f0db',
          200: '#ebdcb0',
          300: '#dec380',
          400: '#cfa64f',
          500: '#b8860b', // Dark golden rod
          600: '#9d6d07',
          700: '#7c5208',
          800: '#67420e',
          900: '#563610',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
