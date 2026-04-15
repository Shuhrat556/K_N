/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(15, 23, 42, 0.18)",
        card: "0 4px 24px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        ink: {
          950: "#0b1220",
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
        },
        mist: "#f6f7fb",
        brand: {
          navy: "#0f2744",
          "navy-deep": "#0a1a30",
          coral: "#f97316",
          "coral-deep": "#ea580c",
        },
      },
    },
  },
  plugins: [],
};
