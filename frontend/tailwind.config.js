/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#05050a',
          dark: '#0a0512',
          panel: 'rgba(10, 5, 18, 0.65)',
          border: 'rgba(0, 240, 255, 0.2)',
          'pink': '#ff007f',
          'cyan': '#00f0ff',
          'purple': '#bd00ff',
          'green': '#00ff66',
          'yellow': '#f1e104',
          'text': '#c3c7db'
        }
      },
      fontFamily: {
        cyber: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'Outfit', 'sans-serif']
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.4), 0 0 2px rgba(0, 240, 255, 0.8)',
        'neon-pink': '0 0 10px rgba(255, 0, 127, 0.4), 0 0 2px rgba(255, 0, 127, 0.8)',
        'neon-purple': '0 0 10px rgba(189, 0, 255, 0.4), 0 0 2px rgba(189, 0, 255, 0.8)',
        'neon-green': '0 0 10px rgba(0, 255, 102, 0.4), 0 0 2px rgba(0, 255, 102, 0.8)',
        'neon-yellow': '0 0 10px rgba(241, 225, 4, 0.4), 0 0 2px rgba(241, 225, 4, 0.8)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'scanline': 'scanline 6s linear infinite',
        'flicker': 'flicker 0.15s infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6), 0 0 5px rgba(0, 240, 255, 0.8)' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        flicker: {
          '0%, 100%': { opacity: 0.99 },
          '50%': { opacity: 0.95 }
        }
      }
    },
  },
  plugins: [],
}
