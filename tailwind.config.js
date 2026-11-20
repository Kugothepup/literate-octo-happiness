/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono Variable"', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        stratosphere: {
          950: '#040914',
          900: '#081224',
          800: '#0f213d',
        },
      },
    },
  },
  plugins: [],
};

