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
  output: "static",
  image: {
    domains: [PUBLIC_WP_URL],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // The Cloudflare adapter otherwise enables Astro sessions and declares a
  // SESSION KV binding with no namespace id, which fails `wrangler deploy`.
  // Nothing in this app uses Astro.session; re-enable it by creating a KV
  // namespace and declaring it in wrangler.jsonc.
  session: false,

  integrations: [react()],
  adapter: cloudflare({
    imageService: "compile",
  }),
});
