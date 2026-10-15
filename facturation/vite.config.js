import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Interface : client/ -> compilée dans client/dist (servie par le serveur Express).
// En développement (npm run dev:client), /api et /template sont relayés vers le serveur.
// base './' : adresses relatives, l'interface fonctionne sous n'importe quel chemin (ex. /facturation).
export default defineConfig(({ command }) => ({
  root: 'client',
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3210', '/template': 'http://localhost:3210' },
  },
}));
