/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/web/views/**/*.html", "./src/web/public/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
      },
      boxShadow: {
        card: "0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        fadeInUp: "fadeInUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
