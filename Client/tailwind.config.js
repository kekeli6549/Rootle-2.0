/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        timber: {
          100: '#F5F5DC', // Beige/Cream (Backgrounds)
          200: '#E6DCC3', // Darker Beige
          300: '#D2B48C', // Tan
          400: '#C19A6B', // Camel
          500: '#A0522D', // Sienna (Primary Buttons - The "Timberland" leather)
          600: '#8B4513', // Saddle Brown (Text/Headers)
          700: '#5D4037', // Dark Espresso (Footer/Nav)
          800: '#3E2723', // Almost Black (Strong Text)
          900: '#283618', // Deep Forest Green (Accents - The "Tree" logo vibe)
        }
      },
      fontFamily: {
        // "Syne" for Headlines: Retro, intentional, unique.
        display: ['Syne', 'sans-serif'],
        // "Space Grotesk" for Body: Readable but with a tech/retro edge.
        body: ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}