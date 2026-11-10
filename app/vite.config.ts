import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        mocks: resolve(import.meta.dirname, 'art-mocks/index.html'),
      },
    },
  },
  test: { include: ['test/**/*.test.ts'] },
});
