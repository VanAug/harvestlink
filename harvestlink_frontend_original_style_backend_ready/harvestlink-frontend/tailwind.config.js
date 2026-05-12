export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        harvest: {
          green: "#14532D",
          leaf: "#2E7D32",
          orange: "#F57C00",
          cream: "#F8F5F0",
          ink: "#1B1B1B",
          soft: "#F3F7F1"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(20, 83, 45, 0.10)"
      }
    },
  },
  plugins: [],
}
