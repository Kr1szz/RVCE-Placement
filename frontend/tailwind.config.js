export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        'bg-dark': '#0f172a',
        'bg-card': 'rgba(30, 41, 59, 0.7)',
        'text-main': '#f8fafc',
        'text-muted': '#94a3b8',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}