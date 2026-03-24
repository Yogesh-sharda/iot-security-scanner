/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          900: '#0a0a0f',
          800: '#13131a',
          700: '#1c1c26',
          green: '#00ff41',
          blue: '#00d2ff',
          red: '#ff2a2a',
          yellow: '#ffcc00'
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
