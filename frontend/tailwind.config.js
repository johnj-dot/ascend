/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10b981', // Gradeway green
          dark: '#1f2937',
          light: '#f3f4f6',
        }
      }
    },
  },
  plugins: [],
}
