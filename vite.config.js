import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/phoenix-greens/",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        // target: "https://brassleaf-api.easybizcart.com",
        changeOrigin: true,
      },
    },
  },
});



// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     port: 5174,
//     proxy: {
//       "/api": {
//         target: "http://localhost:4000",
//         // target: "https://brassleaf-api.easybizcart.com",
//         changeOrigin: true,
//       },
//     },
//   },
// });
