import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: `${here}/viewer`,
  publicDir: `${here}/public`,
  base: './',
  build: { outDir: `${here}/dist`, emptyOutDir: true, assetsDir: 'static' },
});
