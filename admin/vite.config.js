import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,      // change to your desired port
    strictPort: true // fail if port is already in use
  }
});
