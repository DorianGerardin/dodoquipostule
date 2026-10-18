import { defineConfig } from 'vite';

const BASE = '/dodoquipostule/';

export default defineConfig(({ command }) => ({
  // En développement (npm run dev) on reste à la racine ; la base ne vaut que pour le build
  base: command === 'build' ? BASE : '/',
  server: { host: true },
}));