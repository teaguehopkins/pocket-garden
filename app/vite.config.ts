import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative paths so the build works from any folder (e.g. GitHub Pages /<repo>/).
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pocket Garden',
        short_name: 'Pocket Garden',
        description: 'A calm, turn-based garden puzzle. Draft seeds, stack rules, plant through three seasons.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#cfe7f2',
        theme_color: '#cfe7f2',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell plus the Latin font files; other font subsets are cached when first used.
        globPatterns: ['**/*.{js,css,html,svg,png}', '**/*-latin-[0-9]*.woff2'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: /\.woff2$/, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 40 } } },
        ],
      },
    }),
  ],
  test: { include: ['test/**/*.test.ts'] },
});
