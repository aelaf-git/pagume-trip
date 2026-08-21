/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf3",
          100: "#d6f5e1",
          500: "#0f9d58",
          600: "#0c7f47",
          700: "#0a6339",
        },
      },
    },
  },
  plugins: [],
};

