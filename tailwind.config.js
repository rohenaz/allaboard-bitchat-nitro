/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--background-primary)',
          secondary: 'var(--background-secondary)',
          tertiary: 'var(--background-tertiary)',
          'secondary-alt': 'var(--background-secondary-alt)',
          modifier: {
            hover: 'var(--background-modifier-hover)',
            active: 'var(--background-modifier-active)',
            selected: 'var(--background-modifier-selected)',
            accent: 'var(--background-modifier-accent)',
          },
        },
        text: {
          normal: 'var(--text-normal)',
          muted: 'var(--text-muted)',
          link: 'var(--text-link)',
          danger: 'var(--text-danger)',
        },
        header: {
          primary: 'var(--header-primary)',
          secondary: 'var(--header-secondary)',
        },
        interactive: {
          normal: 'var(--interactive-normal)',
          hover: 'var(--interactive-hover)',
          active: 'var(--interactive-active)',
          muted: 'var(--interactive-muted)',
        },
        channeltextarea: {
          background: 'var(--channeltextarea-background)',
        },
        channels: {
          default: 'var(--channels-default)',
        },
      },
    },
  },
  plugins: [],
};
