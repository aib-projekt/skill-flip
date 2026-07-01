/// <reference types="vitest/config" />
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const rootDir = import.meta.dirname;
const dataDir = resolve(rootDir, 'data');

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
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/data/')) {
          const resolved = resolve(rootDir, req.url.slice(1));
          // Reject any request whose resolved path (e.g. via `..` segments)
          // escapes `data/` — dev-server-only guard, since this middleware
          // otherwise rewrites straight to an `@fs` filesystem path.
          if (resolved !== dataDir && !resolved.startsWith(dataDir + sep)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          req.url = `/@fs${resolved}`;
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
