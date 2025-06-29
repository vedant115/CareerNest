import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dns from "dns";

// This helps with localhost resolution issues
dns.setDefaultResultOrder("verbatim");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: "0.0.0.0",
    port: 10002,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".onrender.com",
      "careernest-frontend.onrender.com",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    cors: true,
  },
});
