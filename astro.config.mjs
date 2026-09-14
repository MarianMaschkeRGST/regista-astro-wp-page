// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
const { PUBLIC_WP_URL } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "",
);

// https://astro.build/config
export default defineConfig({
  output: "server",
  image: {
    domains: [PUBLIC_WP_URL],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
  adapter: cloudflare(),
});
