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
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'icons/*.png',
      ],

      manifest: {
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
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
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
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
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