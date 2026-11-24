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
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
        },
      },
    },
  },

  integrations: [react(), mdx()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  trailingSlash: 'never',

  adapter: vercel()
});