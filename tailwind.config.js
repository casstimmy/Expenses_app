// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',

        brand: "#1e40af",
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      
    },
    future: {
    useOkLCH: false,
  },
  },
  plugins: [],
};
