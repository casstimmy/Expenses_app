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

  extend: {
  animation: {
    'fade-in': 'fadeIn 0.3s ease-out',
    'slide-up': 'slideUp 0.4s ease-out'
  },
  keyframes: {
    fadeIn: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 }
    },
    slideUp: {
      '0%': { transform: 'translateY(40px)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 }
    }
  }
}

};
