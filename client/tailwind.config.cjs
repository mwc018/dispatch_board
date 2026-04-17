/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'flash': {
          '0%': { backgroundColor: 'transparent' },
          '20%': { backgroundColor: 'rgba(59, 130, 246, 0.22)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.2s ease-out',
        'flash': 'flash 1.4s ease-out',
      },
    },
  },
  plugins: [],
};
