/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        liveRingPulse: {
          '0%': { transform: 'scale(0.65)', opacity: '0.55' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        liveCoreBreathe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(0.9)' },
        },
      },
      animation: {
        'live-ring': 'liveRingPulse 1.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'live-core': 'liveCoreBreathe 1.75s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
