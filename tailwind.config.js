/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#000000",
        "bg-secondary": "#1C1C1E",
        "bg-tertiary": "#2C2C2E",
        "bg-glass": "rgba(44,44,46,0.72)",
        "text-primary": "#FFFFFF",
        "text-secondary": "#8E8E93",
        "text-tertiary": "#636366",
        "accent-primary": "#0A84FF",
        "accent-green": "#30D158",
        "accent-red": "#FF453A",
        "accent-orange": "#FF9F0A",
        "accent-purple": "#BF5AF2",
        "accent-teal": "#64D2FF",
        "accent-gold": "#FFD60A"
      }
    }
  },
  plugins: []
};
