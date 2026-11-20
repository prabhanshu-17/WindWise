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
          bg: '#080B11',
          sidebar: '#0C1017',
          card: '#111620',
          cardSecondary: '#161D2A',
          cardElevated: '#1B2433',
          accent: '#10B981',        // Emerald for verified actuals
          accentBlue: '#0284C7',    // Deep sky for forecast models
          accentTeal: '#14B8A6',
          warning: '#F59E0B',
          danger: '#EF4444',
          textPrimary: '#FFFFFF',
          textSecondary: '#94A3B8',
          textMuted: '#64748B',
          border: '#1E2638',
          borderLight: '#2A364E',
          hover: '#182130',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
        'subtle': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'dropdown': '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
}
