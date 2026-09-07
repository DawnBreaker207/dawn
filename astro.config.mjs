// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://dawn.io.vn',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), mdx()],

  trailingSlash: 'never',

  adapter: vercel()
});