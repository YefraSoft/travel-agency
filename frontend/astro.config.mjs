// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    host: true,
  },
  vite: {
    server: {
      allowedHosts: ["lanky-violator-freight.ngrok-free.dev"],
    },
  },
});
