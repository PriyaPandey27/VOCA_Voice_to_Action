/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'voca-bg': '#F8FAFC',
        'voca-card': '#FFFFFF',
        'voca-border': '#E2E8F0',
        'voca-border-hover': '#CBD5E1',
        'voca-text': '#0F172A',
        'voca-text-dim': '#334155',
        'voca-text-muted': '#64748B',
        'voca-primary': '#4F46E5',
        'voca-primary-hover': '#4338CA',
        'voca-indigo': '#6366F1',
        'voca-emerald': '#10B981',
        'voca-amber': '#F59E0B',
        'voca-rose': '#F43F5E',
        'voca-violet': '#8B5CF6',
        'voca-sky': '#0EA5E9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'spin-slow': 'spin 10s linear infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '70%': { boxShadow: '0 0 0 18px rgba(99, 102, 241, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
        },
      },
    },
  },
  plugins: [],
}
