/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'in': 'in 0.4s ease-out',
        'slide-in-from-right-5': 'slideInFromRight 0.4s ease-out',
      },
      keyframes: {
        in: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(20px)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
