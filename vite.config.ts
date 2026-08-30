import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/expense-tracker/',
  plugins: [
    react(),

    babel({
      presets: [reactCompilerPreset()],
    }),

    VitePWA({
      registerType: 'prompt',

      includeAssets: [
        'favicon.svg',
        'icons/*.png',
      ],

      manifest: {
        id: '/expense-tracker/',
        name: 'Expense Tracker',
        short_name: 'Expenses',
        description:
          'A simple mobile-first personal expense tracker.',
        theme_color: '#f4f5f7',
        background_color: '#f4f5f7',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/expense-tracker/',
        start_url: '/expense-tracker/',
        categories: ['finance', 'productivity'],
        lang: 'en',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/home-mobile.png',
            sizes: '390x844',
            type: 'image/png',
          },
          {
            src: 'screenshots/home-desktop.png',
            sizes: '1440x900',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,woff2}',
        ],

        navigateFallback: 'index.html',

        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'document',

            handler: 'NetworkFirst',

            options: {
              cacheName: 'expense-tracker-pages',

              networkTimeoutSeconds: 3,

              expiration: {
                maxEntries: 10,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: ({ request }) =>
              ['script', 'style', 'worker'].includes(
                request.destination,
              ),

            handler: 'StaleWhileRevalidate',

            options: {
              cacheName: 'expense-tracker-static',

              expiration: {
                maxEntries: 50,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: ({ request }) =>
              request.destination === 'image',

            handler: 'CacheFirst',

            options: {
              cacheName: 'expense-tracker-images',

              expiration: {
                maxEntries: 50,

                maxAgeSeconds:
                  60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
})