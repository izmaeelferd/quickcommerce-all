import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_DEV_PORT || 5173),
      proxy: env.VITE_DEV_PROXY ? { '/api': env.VITE_DEV_PROXY, '/uploads': env.VITE_DEV_PROXY, '/socket.io': { target: env.VITE_DEV_PROXY, ws: true } } : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], charts: ['recharts'], realtime: ['socket.io-client', 'axios'] } } },
    },
  };
});
