// Node 26's experimental global `webstorage` (localStorage/sessionStorage)
// takes precedence over jsdom's own `window.localStorage` getter under
// vitest's jsdom environment, leaving `window.localStorage` undefined in
// tests even though jsdom's real Storage instance is alive internally as
// `window._localStorage`. Re-point it once here so no individual test file
// needs to work around it.
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  const internal = (window as unknown as { _localStorage?: Storage })._localStorage;
  if (internal) {
    Object.defineProperty(window, 'localStorage', {
      value: internal,
      configurable: true,
      writable: true,
    });
  }
}
