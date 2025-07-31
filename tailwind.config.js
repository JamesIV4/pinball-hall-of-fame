/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{js,ts,jsx,tsx,scss}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arcade': ['Arcade', 'monospace'],
      },
    },
  },
  plugins: [],
};
