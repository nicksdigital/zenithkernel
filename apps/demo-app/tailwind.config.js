/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,zk}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors following the guidelines with blueish tones
        dark: {
          primary: '#0f172a', // More blueish dark
          secondary: '#1e293b', // Blueish secondary
          accent: '#3b82f6', // Blue accent
          'accent-purple': '#6366f1', // Purple-blue
          success: '#10b981',
          border: 'rgba(59,130,246,0.2)', // Blue-tinted border
          'text-primary': '#ffffff',
          'text-secondary': '#94a3b8', // Slightly blueish gray
        },
        // Keep existing colors for compatibility
        zenith: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#6366f1', // Updated to match guidelines
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'zenith': '0 4px 20px -2px rgba(124, 58, 237, 0.25)',
        'dark-card': '0 25px 50px -12px rgba(0,0,0,0.25)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      borderRadius: {
        'card': '24px',
        'button': '12px',
        'pill': '20px',
      },
    },
  },
  plugins: [],
}
