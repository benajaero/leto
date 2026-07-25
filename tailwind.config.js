/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        /**
         * LETO runs cool where the rest of Human Engine runs warm, and that is
         * correct: this is a map and telemetry surface read under operational
         * pressure, and warm neutrals wash out over satellite imagery. What it
         * shares with the family is the accent — aged gold instead of the
         * generic dashboard cyan it used to carry.
         *
         * 550 and below are structural (borders, fills, dividers).
         * 500 and above are text, and each clears 4.5:1 on the 800 panel.
         * The previous 400 and 500 measured 2.93:1 and 1.75:1 and were used as
         * text 98 times across the app.
         */
        aerospace: {
          950: '#020204',
          900: '#050507',
          850: '#0a0a0f',
          800: '#0d0d12',
          750: '#111118',
          700: '#1a1a24',
          650: '#22222e',
          600: '#2a2a3a',
          550: '#3a3a4f', // was 500 — structural only, never text
          500: '#82829a', // 5.18:1 on 800, 4.61:1 even on 700 — dimmest readable
          400: '#9494ab', // 6.54:1
          300: '#a0a0b5', // 7.56:1
          200: '#c4c4d6',
          100: '#e2e2f0'
        },
        /** Aged gold, shared with humanengine.co. 8.58:1 on the 800 panel. */
        signal: {
          300: '#d9bd85',
          400: '#c9a86c',
          500: '#a67c52'
        },
        /**
         * Status stays semantic and stays saturated — on a triage surface these
         * carry meaning, not brand. All four clear AA on the panel.
         */
        status: {
          good: '#34d399', // 10.08:1
          warn: '#f59e0b', // 9.03:1
          bad: '#f87171', //  7.01:1
          info: '#c9a86c' //  8.58:1
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace']
      },
      fontSize: {
        /** Legibility floor. Nothing on this surface goes below 11px. */
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        readout: ['0.75rem', { lineHeight: '1.1rem' }]
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, #1a1a24 1px, transparent 1px), linear-gradient(to bottom, #1a1a24 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '40px 40px'
      },
      boxShadow: {
        'glow-signal': '0 0 20px rgba(201, 168, 108, 0.18)',
        'glow-green': '0 0 20px rgba(52, 211, 153, 0.15)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-red': '0 0 20px rgba(248, 113, 113, 0.15)'
      },
      minHeight: {
        touch: '44px'
      }
    }
  },
  plugins: []
};
