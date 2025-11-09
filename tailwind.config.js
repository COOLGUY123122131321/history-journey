/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        display: ['Lora', 'serif'],
        cinzel: ['Cinzel', 'serif'],
      },
      colors: {
        'brand-bg': '#F5F1E9', // Parchment
        'brand-text': '#433A3F', // Ink
        'brand-primary': '#8B4513', // Saddle Brown
        'brand-secondary': '#A0522D', // Sienna
        'brand-accent': '#C0A080', // Light wood
        'brand-blue': '#4A6984', // Muted blue
        'brand-gold': '#b68b3a',
        'brand-dark-bg': '#2C2A29',
        'brand-frame': '#6b4f3a',
        'brand-frame-highlight': '#a17c5b',
        'brand-amber': '#D97706', // New amber for buttons
      },
      keyframes: {
        'bg-zoom': {
          'from': { transform: 'scale(1)' },
          'to': { transform: 'scale(1.15)' },
        },
        'title-write': {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'fade-in-late': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'owl-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-glow': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(182, 139, 58, 0.4)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 15px 5px rgba(182, 139, 58, 0)' },
        },
        'chick-wise': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px) rotate(2deg)' },
        },
        'pulse-resource': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.15)', filter: 'brightness(1.2)' },
        },
        'fadeInUp': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'sparkle': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'parchment-unroll': {
          'from': { maxHeight: '0', opacity: '0', transform: 'scaleY(0.9)' },
          'to': { maxHeight: '800px', opacity: '1', transform: 'scaleY(1)' },
        },
      },
      animation: {
        'bg-zoom': 'bg-zoom 15s ease-in-out infinite alternate',
        'title-write': 'title-write 2s steps(40, end) forwards',
        'fade-in-late': 'fade-in-late 1s ease-out 2.2s forwards',
        'owl-bob': 'owl-bob 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s infinite',
        'chick-wise': 'chick-wise 3s ease-in-out infinite',
        'pulse-resource': 'pulse-resource 0.7s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'sparkle': 'sparkle 2s linear infinite',
        'parchment-unroll': 'parchment-unroll 0.8s ease-out forwards',
      }
    },
  },
  plugins: [],
}
