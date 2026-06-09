/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        aerospace: {
          950: '#020204',
          900: '#050507',
          850: '#0a0a0f',
          800: '#0d0d12',
          750: '#111118',
          700: '#1a1a24',
          650: '#22222e',
          600: '#2a2a3a',
          500: '#3a3a4f',
          400: '#5a5a7a',
          300: '#8a8aaa',
          200: '#b8b8d0',
          100: '#e2e2f0'
        },
        cyan: {
          400: '#00d4ff',
          300: '#33ddff',
          500: '#00a8cc'
        },
        status: {
          good: '#10b981',
          warn: '#f59e0b',
          bad: '#ef4444',
          info: '#00d4ff'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace']
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1a1a24 1px, transparent 1px), linear-gradient(to bottom, #1a1a24 1px, transparent 1px)"
      },
      backgroundSize: {
        'grid': '40px 40px'
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)'
      }
    }
  },
  plugins: []
};
