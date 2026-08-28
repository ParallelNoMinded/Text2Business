import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    define: {
      'process.env': {},
    },
    plugins: [react(), tailwindcss()],
    // The server process loads project env files via tsx. Keeping Vite's env
    // directory separate prevents both Vite and the v0 runtime from restarting
    // the same process when .env.development.local changes.
    envDir: path.resolve(__dirname, '.vite-env'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Разрешаем хосты предпросмотра (локальный запуск и облачная песочница).
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.vercel.run',
        '.vusercontent.net',
        '.v0.build',
      ],
      // In middleware mode server.ts attaches HMR to the existing Express
      // HTTP server, keeping HTTP and WebSocket traffic on one Preview origin.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
