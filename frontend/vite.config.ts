/**
 * Vite configuration for Workz ToDo frontend
 * - React SWC plugin for fast HMR
 * - Build emits to ./frontend/dist so postbuild script can copy into Frappe app
 * - Use relative asset paths so SPA works under /workz without 404s
 * - No server proxy by default; frappe-react-sdk can be configured with url in provider
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    open: false
  },
  preview: {
    port: 5174
  },
  build: {
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true
  }
});