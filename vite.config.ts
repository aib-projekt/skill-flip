/// <reference types="vitest/config" />
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const rootDir = import.meta.dirname;

/**
 * Serves and bundles the repo-root `data/` directory (the single source of
 * truth also read directly by `content-pipeline/validate-glossary.ts`) as a
 * `/data/*` static asset, without requiring it to live under Vite's default
 * `public/` directory.
 */
function serveRootData(): Plugin {
  return {
    name: 'serve-root-data',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/data/')) {
          req.url = `/@fs${resolve(rootDir, req.url.slice(1))}`;
        }
        next();
      });
    },
    closeBundle() {
      const outDir = resolve(rootDir, 'dist/data');
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      copyFileSync(resolve(rootDir, 'data/glossary.json'), resolve(outDir, 'glossary.json'));
    },
  };
}

export default defineConfig({
  base: '/skill-flip/',
  plugins: [serveRootData()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
