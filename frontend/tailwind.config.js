/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wind: {
          bg: '#0B1120',
          sidebar: '#101827',
          card: '#151F30',
          cardSecondary: '#1A2639',
          accent: '#35D399',
          accentBlue: '#38BDF8',
          warning: '#FBBF24',
          danger: '#FB7185',
          textPrimary: '#F8FAFC',
          textSecondary: '#94A3B8',
          border: '#263449',
          borderLight: '#33435C',
          hover: '#1E2D44',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'glow-green': '0 0 15px -3px rgba(53, 211, 153, 0.3)',
        'glow-blue': '0 0 15px -3px rgba(56, 189, 248, 0.3)',
      }
    },
  },
  plugins: [],
}
