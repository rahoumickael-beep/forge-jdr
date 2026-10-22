import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le client tourne sur 5173 en dev et parle au serveur (3001) via le proxy.
export default defineConfig({
  root: "client",
  plugins: [react()],
  build: { outDir: "../dist", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": { target: "http://localhost:3001", ws: true },
    },
  },
});
