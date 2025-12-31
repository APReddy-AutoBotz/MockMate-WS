import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
              {
                urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'firebase-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                  },
                },
              },
            ],
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'MockMate - AI Interview Coach',
            short_name: 'MockMate',
            description: 'AI-powered interview coaching platform for job seekers',
            theme_color: '#0A192F',
            background_color: '#0A192F',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-apple-180x180.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'apple touch icon'
              },
              {
                src: 'pwa-maskable-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Start Interview',
                short_name: 'Interview',
                description: 'Start a new mock interview session',
                url: '/?action=interview',
                icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'View Reports',
                short_name: 'Reports',
                description: 'View your interview performance reports',
                url: '/?action=reports',
                icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
              }
            ],
            categories: ['education', 'productivity', 'business'],
            lang: 'en',
            dir: 'ltr',
            prefer_related_applications: false,
            screenshots: [
              {
                src: 'screenshot-desktop.png',
                sizes: '1280x720',
                type: 'image/png',
                form_factor: 'wide',
                label: 'MockMate on desktop'
              },
              {
                src: 'screenshot-mobile.png',
                sizes: '375x667',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'MockMate on mobile'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      build: {
        rollupOptions: {
          external: ['@google/genai', 'firebase-admin'],
          output: {
            manualChunks: {
                // Split vendor chunks
                vendor: ['react', 'react-dom', 'framer-motion', 'recharts'],
                // Split feature chunks
                dashboard: ['./components/GrowthDashboard.tsx'],
                reports: ['./components/InterviewReport.tsx'],
                session: ['./components/MockSession.tsx'],
                auth: ['./components/Login.tsx', './components/LandingPage.tsx', './components/OnboardingQuestions.tsx']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      }
    };
});
