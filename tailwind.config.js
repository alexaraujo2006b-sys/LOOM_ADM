/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,context,hooks,utils,pages,views}/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#047857',
        'brand-light-green': '#059669',
        'brand-accent': '#34D399',
      },
    },
  },
  plugins: [],
}
