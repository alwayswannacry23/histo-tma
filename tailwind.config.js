/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg-page, #F2F4F7)',
          card: 'var(--bg-card, #FFFFFF)',
          'card-secondary': 'var(--bg-card-secondary, #F8FAFC)',
          text: 'var(--text-primary, #0F172A)',
          muted: 'var(--text-muted, #64748B)',
          accent: 'var(--accent-primary, #4F46E5)',
          'accent-hover': 'var(--accent-hover, #4338CA)',
          'accent-soft': 'var(--accent-soft, #EEF2FF)',
          'accent-text': 'var(--accent-text, #4F46E5)',
          dark: '#090D16',
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
        'ios': '0 2px 12px rgba(15, 23, 42, 0.04)',
        'ios-elevated': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'ios-bar': '0 -4px 20px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
