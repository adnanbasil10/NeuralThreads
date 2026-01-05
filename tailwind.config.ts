import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  // Add max-width variants for desktop-first approach
  plugins: [
    function({ addVariant }: { addVariant: (name: string, query: string) => void }) {
      addVariant('max-sm', '@media (max-width: 639px)');
      addVariant('max-md', '@media (max-width: 767px)');
      addVariant('max-lg', '@media (max-width: 1023px)');
      addVariant('max-xl', '@media (max-width: 1279px)');
      addVariant('max-2xl', '@media (max-width: 1535px)');
    },
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Luxury Beige Palette
        beige: {
          soft: '#E8DED0',
          cream: '#F5F0E8',
          sand: '#EDE6DB',
          pure: '#D9CFC1',
        },
        taupe: {
          deep: '#9B8B7E',
          warm: '#8B7A6B',
        },
        rose: {
          soft: '#D4B5A8',
          dusty: '#C9A899',
        },
        brown: {
          heading: '#4A3F35',
          body: '#6B5F52',
          secondary: '#8B7E71',
          muted: '#A39689',
        },
        // Stone color palette (overriding default for beige aesthetic)
        stone: {
          50: '#F5F0E8', // Warm Cream
          100: '#EDE6DB', // Light Sand
          200: '#D9CFC1', // Pure Beige
          300: '#C9A899', // Dusty Pink
          400: '#A39689', // Muted Text
          500: '#8B7E71', // Secondary Text
          600: '#6B5F52', // Body Text
          700: '#4A3F35', // Primary Headings
          800: '#3A3028', // Darker Brown
          900: '#2A221E', // Deepest Brown
        },
        // Neural Threads brand colors (keeping for compatibility)
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Neutral fashion palette
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Accent colors
        accent: {
          gold: '#d4af37',
          rose: '#e11d48',
          emerald: '#059669',
          sapphire: '#2563eb',
        },
        // Warm Neutral Color Palette
        warm: {
          light: '#F9DBBD',      // Light orange
          apricot: '#E8B39A',     // Apricot
          coral: '#D78A76',       // Coral pink
          rose: '#B57168',        // Old rose
          taupe: '#93575A',       // Rose taupe
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['Playfair Display', 'var(--font-display)', 'Georgia', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(168, 85, 247, 0.35)',
        'glow-lg': '0 0 30px rgba(168, 85, 247, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
};
export default config;
