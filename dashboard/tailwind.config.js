/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "12px",
        xl: "18px",
        "2xl": "24px",
      },
      colors: {
        background: "#020617",
        foreground: "#e5e7eb",
        crispBlue: "#2b7bff",
      },
    },
  },
  plugins: [],
};