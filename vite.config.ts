import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
