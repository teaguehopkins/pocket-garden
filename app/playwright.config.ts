import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:5199', channel: 'chrome', viewport: { width: 360, height: 780 }, hasTouch: true },
  webServer: [
    { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199', reuseExistingServer: true },
    { command: 'npx vite build && npx vite preview --port 5198 --strictPort', url: 'http://localhost:5198', reuseExistingServer: true, timeout: 120_000 },
  ],
  projects: [
    { name: 'light', use: { colorScheme: 'light' }, testIgnore: /pwa\.spec/ },
    { name: 'dark', use: { colorScheme: 'dark' }, testIgnore: /pwa\.spec/ },
    { name: 'pwa', use: { baseURL: 'http://localhost:5198' }, testMatch: /pwa\.spec/ },
    { name: 'reduced-motion', use: { reducedMotion: 'reduce' }, testMatch: /run\.spec/ },
  ],
});
