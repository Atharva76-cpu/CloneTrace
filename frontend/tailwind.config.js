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
        cyber: {
          900: '#030712', // Deep navy/black
          800: '#0a0f24',
          700: '#111836',
          blue: '#00f0ff', // Electric cyan/blue
          purple: '#b026ff', // Neon violet
          red: '#ff2a2a', // Threat red
          green: '#00ff66',
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'threat-gradient': 'linear-gradient(145deg, rgba(255,42,42,0.1) 0%, rgba(255,42,42,0.02) 100%)',
        'safe-gradient': 'linear-gradient(145deg, rgba(0,255,102,0.1) 0%, rgba(0,255,102,0.02) 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.6), inset 0 0 20px rgba(0, 240, 255, 0.3)' }
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
