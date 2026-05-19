import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-josefin)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        void: 'var(--color-void)',
        surface: 'var(--color-surface)',
        paper: 'var(--color-paper)',
        stone: 'var(--color-stone)',
        threshold: 'var(--color-threshold)',
        glass: 'var(--color-glass)',
        border: 'var(--color-border)',
      },
      spacing: {
        unit: 'var(--space-unit)',
        section: 'var(--section-padding)',
      },
      maxWidth: {
        content: 'var(--content-max)',
        text: 'var(--text-max)',
      },
      fontSize: {
        'display-xl': [
          'clamp(64px, 8vw, 120px)',
          { lineHeight: '1.0', letterSpacing: '0.05em', fontWeight: '300' },
        ],
        'display-lg': [
          'clamp(48px, 6vw, 96px)',
          { lineHeight: '1.1', letterSpacing: '0.05em', fontWeight: '300' },
        ],
        'display-md': [
          'clamp(36px, 4vw, 64px)',
          { lineHeight: '1.1', letterSpacing: '0em', fontWeight: '400' },
        ],
        heading: [
          'clamp(24px, 3vw, 40px)',
          { lineHeight: '1.2', letterSpacing: '0em', fontWeight: '600' },
        ],
        'body-lg': ['18px', { lineHeight: '1.7', fontWeight: '300' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        label: ['11px', { lineHeight: '1.4', letterSpacing: '0.2em', fontWeight: '600' }],
        mono: ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      transitionTimingFunction: {
        smooth: 'var(--ease-smooth)',
        entrance: 'var(--ease-entrance)',
        exit: 'var(--ease-exit)',
        spring: 'var(--ease-spring)',
        cinematic: 'var(--ease-cinematic)',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        medium: 'var(--duration-medium)',
        slow: 'var(--duration-slow)',
        cinematic: 'var(--duration-cinematic)',
      },
      borderRadius: {
        none: '0',
      },
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
