/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fff5f9',
          100: '#ffe4ef',
          200: '#ffc7df',
          300: '#ffa0c6',
          400: '#ff78ad',
          500: '#ff4d92',
          600: '#e53a79',
          700: '#c42b5f',
          800: '#9f234f',
          900: '#7f1d42'
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'ui-serif', 'Georgia', 'serif']
      },
      boxShadow: {
        panel: '0 24px 50px -30px rgba(15, 23, 42, 0.45)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        'soft-glow': {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 0.9 }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'soft-glow': 'soft-glow 8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
