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
        // AUSNAHME: das schwere ML-Paket (transformers.js + onnxruntime) bleibt im
        // eigenen, dynamisch geladenen Chunk — es soll NUR beim semantischen
        // Rückblick geladen werden, nicht beim Erststart.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("@xenova/transformers") ||
            id.includes("onnxruntime") ||
            id.includes("@huggingface")
          ) {
            return;
          }
          return "vendor";
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
