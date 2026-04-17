/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        card: 'oklch(var(--card))',
        'card-foreground': 'oklch(var(--card-foreground))',
        popover: 'oklch(var(--popover))',
        'popover-foreground': 'oklch(var(--popover-foreground))',
        primary: 'oklch(var(--primary))',
        'primary-foreground': 'oklch(var(--primary-foreground))',
        secondary: 'oklch(var(--secondary))',
        'secondary-foreground': 'oklch(var(--secondary-foreground))',
        muted: 'oklch(var(--muted))',
        'muted-foreground': 'oklch(var(--muted-foreground))',
        accent: 'oklch(var(--accent))',
        'accent-foreground': 'oklch(var(--accent-foreground))',
        destructive: 'oklch(var(--destructive))',
        border: 'oklch(var(--border))',
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
        dark: {
          bg: '#0b0e14',
          page: '#111827',
          card: '#1a1f2e',
          'card-hover': '#1f2537',
          sidebar: '#0f1219',
          border: 'rgba(255,255,255,0.06)',
          input: '#0f1219',
        },
      },
     fontFamily: {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
},
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
        border: 'oklch(var(--border))',
      },
      outlineColor: {
        ring: 'oklch(var(--ring))',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
