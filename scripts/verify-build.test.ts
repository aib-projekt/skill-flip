/**
 * Build & deploy-config smoke tests for Task Group 8.
 *
 * Standalone Node/TS tooling, in the same spirit as
 * `content-pipeline/validate-glossary.test.ts`: deliberately NOT run via
 * Vitest (which is scoped to `src/**\/*.test.ts` in vite.config.ts). These
 * checks assert on real build *output* (`dist/`) and on the shape of
 * `vite.config.ts` itself, neither of which is a `src/` unit-testing concern.
 *
 * Run directly:
 *   node --experimental-strip-types --test scripts/verify-build.test.ts
 *
 * Wired into the same `npm test` gate via the `test` script composition in
 * package.json (`vitest run && node --experimental-strip-types --test
 * scripts/verify-build.test.ts`), per plan step 8.1's requirement that both
 * new checks run through `npm test`.
 *
 * Note: this file requires a prior `npm run build` (it inspects the
 * already-built `dist/` directory rather than invoking the build itself, to
 * keep the check fast and side-effect-free when run repeatedly).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');

test('npm run build output: dist/index.html exists with asset paths prefixed by /skill-flip/', () => {
  const indexPath = resolve(rootDir, 'dist/index.html');
  let html: string;
  try {
    html = readFileSync(indexPath, 'utf-8');
  } catch {
    throw new Error(
      `dist/index.html not found at ${indexPath} — run \`npm run build\` before this check.`
    );
  }

  // At least one script/link asset reference, and every asset reference
  // that points at Vite's bundled output must be prefixed by the
  // configured base path (not left root-relative as `/assets/...`).
  const assetRefs = [...html.matchAll(/(?:src|href)="(\/[^"]*assets\/[^"]+)"/g)].map((m) => m[1]);

  assert.ok(
    assetRefs.length > 0,
    'expected dist/index.html to reference at least one built asset (script or stylesheet)'
  );
  for (const ref of assetRefs) {
    assert.ok(
      ref.startsWith('/skill-flip/'),
      `expected asset path "${ref}" to be prefixed with /skill-flip/`
    );
  }
});

test('vite.config.ts exports base: "/skill-flip/"', () => {
  const configPath = resolve(rootDir, 'vite.config.ts');
  const source = readFileSync(configPath, 'utf-8');

  // Config-shape assertion: confirms the literal base path is present in
  // the defineConfig(...) call without importing/evaluating the config
  // module (which pulls in the Vite plugin API and jsdom-only test config).
  assert.match(
    source,
    /base:\s*['"]\/skill-flip\/['"]/,
    'expected vite.config.ts to set base: \'/skill-flip/\''
  );
});
