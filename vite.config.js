import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true
    }),
    VitePWA({
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.svg',
        'icons/icon-512.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon-180x180.png'
      ],
      manifest: {
        name: 'Roxy GYM',
        short_name: 'RoxyGYM',
        description: 'Roxy GYM member and membership management',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#38bdf8',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/__/, /^\/api/, /googleapis\.com/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
        globIgnores: ['**/stats.html'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'unsplash-images-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
          }
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});
