/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scp: {
          navy: '#1c3d6b',
          'navy-dark': '#0d1f36',
          green: '#b5bd00',
          gray: '#63666b',
          'gray-mid': '#75787b',
          'gray-light': '#babbbc',
          'green-dark': '#7f8435',
          cyan: '#009ac8',
          'cyan-light': '#43c4de',
          blue: '#3078bd',
          'navy-tint': '#edf3f7',
          'gray-cool': '#cfcfcf',
          'gray-warm': '#ededed',
        }
      },
      fontFamily: {
        sans: ['"Source Sans Pro"', 'Ubuntu', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(28, 61, 107, 0.08)',
        'card-hover': '0 4px 24px rgba(28, 61, 107, 0.15)',
      }
    },
  },
  plugins: [],
}

