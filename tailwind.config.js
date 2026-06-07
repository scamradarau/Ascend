/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        rune: ['Cinzel', 'serif'],
      },
      colors: {
        // Ascend brand blue (title slide)
        brand: {
          DEFAULT: '#4D7FE0',
          50: '#eaf1ff',
          400: '#6f9bff',
          500: '#4D7FE0',
          600: '#3a63bf',
        },
        // Cosmos theme
        cosmos: {
          bg: '#070a18',
          panel: '#0d1224',
          panel2: '#131a33',
          edge: '#1f2a52',
          cyan: '#22d3ee',
          violet: '#a855f7',
          magenta: '#ec4899',
          gold: '#fbbf24',
        },
        exp: {
          DEFAULT: '#7CFC00',
          dark: '#3f9c00',
        },
        // Rune (MMO) theme
        rune: {
          bg: '#1a120b',
          panel: '#2b1d10',
          wood: '#5a3a1b',
          parchment: '#e9d9b0',
          gold: '#d4af37',
          ember: '#e0701a',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(34,211,238,0.45)',
        'glow-violet': '0 0 22px rgba(168,85,247,0.5)',
        'glow-exp': '0 0 16px rgba(124,252,0,0.55)',
        'glow-gold': '0 0 18px rgba(212,175,55,0.55)',
        panel: '0 8px 40px rgba(0,0,0,0.5)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        levelup: {
          '0%': { transform: 'scale(0.5) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 5s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        scan: 'scan 4s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        popIn: 'popIn 0.35s ease-out',
        levelup: 'levelup 0.6s cubic-bezier(0.2,0.8,0.2,1)',
      },
    },
  },
  plugins: [],
}
