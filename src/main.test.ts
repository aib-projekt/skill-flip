import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * `main.ts` is a bootstrap script with a module-scope side effect
 * (`void bootstrap()`) and no exports — it fetches `data/glossary.json` and
 * mounts `AppShell` into `#app`, or renders a visible `.app-error` state on
 * fetch failure/empty data (spec Section 1: "fails loudly ... on fetch
 * failure or empty array", Success Criteria bullet 1).
 *
 * This was previously untested (Group 9 gap analysis): no unit coverage
 * existed for the error-state branch at all. Each test re-imports the module
 * fresh via `vi.resetModules()` + dynamic `import()` so the top-level
 * `bootstrap()` call re-runs against a fresh `#app` container and a
 * per-test `fetch` mock.
 */

async function mountFreshAndFlush(): Promise<void> {
  document.body.innerHTML = '<div id="app"></div>';
  vi.resetModules();
  await import('./main');
  // Flush the microtask queue so the async bootstrap() (fetch -> json -> mount) settles.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('main.ts bootstrap error handling', () => {
  const originalFetch = global.fetch;
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockClear();
  });

  it('renders a visible .app-error state (not a blank screen) when fetch() rejects', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    await mountFreshAndFlush();

    const appEl = document.querySelector('#app');
    expect(appEl?.querySelector('.app-error')).not.toBeNull();
    expect(appEl?.textContent).toContain('Unable to load Skill Flip');
    expect(appEl?.querySelector('.app-shell')).toBeNull();
  });

  it('renders a visible .app-error state when fetch() resolves but the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    await mountFreshAndFlush();

    const appEl = document.querySelector('#app');
    expect(appEl?.querySelector('.app-error')).not.toBeNull();
    expect(appEl?.textContent).toContain('Unable to load Skill Flip');
  });

  it('renders a visible .app-error state when the fetched glossary is an empty array (fails loudly, not a silent blank screen)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await mountFreshAndFlush();

    const appEl = document.querySelector('#app');
    expect(appEl?.querySelector('.app-error')).not.toBeNull();
    expect(appEl?.textContent).toContain('Unable to load Skill Flip');
  });
});
