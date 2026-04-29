/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F4FE',
          500: '#2B7FD4',
          900: '#0F3460',
        },
      },
    },
  },
  plugins: [],
};
