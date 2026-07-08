/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        kadansaLight: {
          "primary": "#3a8f17",
          "primary-content": "#ffffff",
          "secondary": "#649954",
          "secondary-content": "#ffffff",
          "accent": "#40802f",
          "accent-content": "#ffffff",
          "neutral": "#181818",
          "neutral-content": "#f7fdf5",
          "base-100": "#ffffff",
          "base-200": "#f7fdf5",
          "base-300": "#e7fddf",
          "base-content": "#181818",
          "info": "#3a8f17",
          "success": "#40802f",
          "warning": "#c9891a",
          "error": "#c0392b",
        },
      },
      {
        kadansaDark: {
          "primary": "#5fc231",
          "primary-content": "#0c1409",
          "secondary": "#93c185",
          "secondary-content": "#0c1409",
          "accent": "#7ad654",
          "accent-content": "#0c1409",
          "neutral": "#14160f",
          "neutral-content": "#f2f8ee",
          "base-100": "#101210",
          "base-200": "#171a16",
          "base-300": "#1c2818",
          "base-content": "#f2f8ee",
          "info": "#5fc231",
          "success": "#7ad654",
          "warning": "#e0a83a",
          "error": "#e0685a",
        },
      },
    ],
    darkTheme: "kadansaDark",
  },
};
