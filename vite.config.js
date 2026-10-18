import { defineConfig } from 'vite';

const BASE = '/dodoquipostule/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  server: { host: true },
}));