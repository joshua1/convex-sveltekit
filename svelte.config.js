import adapter from "@sveltejs/adapter-vercel"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: adapter(),
    alias: {
      $convex: "./src/convex",
      $demo: "./src/demo",
    },
  },
  vitePlugin: {
    inspector: {
      toggleKeyCombo: "alt-shift",
    },
  },
}

export default config
