/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1A1614",
          soft: "#2C2622",
          muted: "#5C534C",
        },
        bone: {
          DEFAULT: "#F6F1E8",
          warm: "#EDE4D6",
          deep: "#D9CBB8",
        },
        berry: {
          DEFAULT: "#8B3A4A",
          deep: "#6B2A38",
          soft: "#C47886",
        },
        sage: {
          DEFAULT: "#5C6B4A",
          soft: "#8A9A74",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-grain":
          "radial-gradient(ellipse at 20% 20%, rgba(139,58,74,0.35), transparent 50%), radial-gradient(ellipse at 80% 60%, rgba(92,107,74,0.25), transparent 45%), linear-gradient(160deg, #1A1614 0%, #2C2622 55%, #1A1614 100%)",
        "section-wash":
          "linear-gradient(180deg, #F6F1E8 0%, #EDE4D6 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.6s ease-out both",
        "scale-in": "scale-in 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
