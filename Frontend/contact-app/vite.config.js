import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // "@/components/ui/button" means src/components/ui/button (used by the shadcn/ui components).
    alias: { "@": path.resolve(root, "src") },
  },
  // Port 3000 is the one the backend allows in its CORS settings (app.cors.allowed-origins).
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  // Same output folder as Create React App used.
  build: { outDir: "build" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    css: false,
    // Like Create React App did: every test starts with fresh mocks.
    mockReset: true,
  },
});
