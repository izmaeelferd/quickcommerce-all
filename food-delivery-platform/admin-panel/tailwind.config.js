/** Colors resolve to CSS variables that are set at runtime from /api/config (theme). */
const v = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: v('primary'),
        secondary: v('secondary'),
        accent: v('accent'),
        surface: v('surface'),
        background: v('background'),
        content: v('text'),
        success: v('success'),
        warning: v('warning'),
        danger: v('error'),
        veg: v('veg'),
        nonveg: v('nonveg'),
        onprimary: v('on-primary'),
        scrim: v('scrim'),
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn: 'var(--radius-button)',
        input: 'var(--radius-input)',
      },
      fontFamily: { app: ['var(--font-app)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
