/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F4F5F7',
          card: '#FFFFFF',
          dark: '#0F172A',
          muted: '#64748B',
          accent: '#2563EB',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'ios': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'ios-elevated': '0 8px 30px rgba(0, 0, 0, 0.07)',
        'ios-bar': '0 -4px 20px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
