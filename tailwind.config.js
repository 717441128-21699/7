/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ocean: {
          50: "#E8F0F8",
          100: "#C5D7E8",
          200: "#8FB4D4",
          300: "#4F85B5",
          400: "#2A5A8C",
          500: "#0A2342",
          600: "#081C35",
          700: "#061528",
          800: "#040E1B",
          900: "#02070E",
        },
        gold: {
          50: "#FDF8E5",
          100: "#FAEEBC",
          200: "#F5DF84",
          300: "#EECB4C",
          400: "#DDB52B",
          500: "#C9A227",
          600: "#A6841E",
          700: "#806516",
          800: "#59470F",
          900: "#332908",
        },
        blood: {
          50: "#FCE8E8",
          100: "#F9C5C5",
          200: "#F28A8A",
          300: "#EB4F4F",
          400: "#BD1E1E",
          500: "#8B0000",
          600: "#700000",
          700: "#540000",
          800: "#380000",
          900: "#1C0000",
        },
        parchment: {
          50: "#FEFAEF",
          100: "#FCF3D6",
          200: "#F8E6A8",
          300: "#F4D97A",
          400: "#F0CC4C",
          500: "#F4E4BC",
          600: "#D4B98A",
          700: "#A89168",
          800: "#7C6946",
          900: "#504124",
        },
        wood: {
          500: "#5C4033",
          600: "#4A3329",
          700: "#38261F",
        },
        copper: {
          500: "#2A9D8F",
          600: "#218074",
        },
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["'IM Fell English'", "serif"],
        mono: ["'Roboto Mono'", "monospace"],
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "wave": "wave 2s ease-in-out infinite",
        "sway": "sway 4s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "scroll": "scroll 30s linear infinite",
        "unfurl": "unfurl 1.2s ease-out forwards",
        "damage": "damage 0.3s ease-out",
        "treasure-glow": "treasure-glow 1.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wave: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(10px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 5px #C9A227" },
          "50%": { boxShadow: "0 0 25px #C9A227, 0 0 40px #DDB52B" },
        },
        scroll: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        unfurl: {
          "0%": { transform: "scaleY(0)", opacity: "0" },
          "100%": { transform: "scaleY(1)", opacity: "1" },
        },
        damage: {
          "0%, 100%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(2) sepia(1) hue-rotate(-50deg)" },
        },
        "treasure-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px #F4D97A)" },
          "50%": { filter: "drop-shadow(0 0 20px #EECB4C)" },
        },
      },
      backgroundImage: {
        "parchment-texture":
          "radial-gradient(ellipse at center, rgba(244,228,188,1) 0%, rgba(212,185,138,1) 100%)",
        "ocean-gradient":
          "linear-gradient(180deg, #0A2342 0%, #081C35 50%, #040E1B 100%)",
        "wood-planks":
          "repeating-linear-gradient(90deg, #5C4033 0px, #4A3329 3px, #5C4033 6px, #38261F 10px)",
      },
    },
  },
  plugins: [],
};
