import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Frontend läuft auf :5173 und proxyt API-Aufrufe an das Express-Backend (:3001).
// So liegt der API-Key nie im Frontend — das Frontend ruft nur sein eigenes Backend.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Selten wechselnde Fremdbibliotheken in einen eigenen, gut cachebaren
        // Vendor-Chunk auslagern (App-Code bleibt klein, Browser-Cache greift).
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
