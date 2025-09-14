/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: "hsl(var(--accent) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif","system-ui","-apple-system",
          "SF Pro Text","SF Pro Display","Inter","Segoe UI",
          "Roboto","Helvetica Neue","Arial"
        ],
      },
      container: {
        center: true,
        padding: "1.5rem",
        screens: {
          "2xl": "1152px",
        },
      },
      borderRadius: { 
        xl: "1rem", 
        "2xl": "1.25rem",
        card: "var(--radius-card)"
      },
      boxShadow: { 
        card: "var(--shadow-card)"
      }
    },
  },
  plugins: [],
}