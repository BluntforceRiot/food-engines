import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: true,
    fs: {
      allow: [process.cwd()]
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  }
});
