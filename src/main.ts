import { createAppShell } from './components/AppShell';
import type { Glossary } from './types/glossary';

/**
 * Bootstrap: fetches the glossary, validates it, and mounts `AppShell` — the
 * final integration point tying together all UI groups (Group 6). Any
 * fetch/parse/empty-array failure renders a visible error state into `#app`
 * rather than leaving a silent blank screen.
 */

function renderError(appEl: HTMLDivElement | null, message: string): void {
  if (!appEl) return;
  appEl.innerHTML = '';

  const errorBox = document.createElement('div');
  errorBox.className = 'app-error';

  const heading = document.createElement('h2');
  heading.textContent = 'Unable to load Skill Flip';

  const detail = document.createElement('p');
  detail.textContent = message;

  errorBox.append(heading, detail);
  appEl.appendChild(errorBox);
}

async function bootstrap(): Promise<void> {
  const appEl = document.querySelector<HTMLDivElement>('#app');

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/glossary.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch glossary: ${response.status} ${response.statusText}`);
    }

    const glossary: Glossary = await response.json();

    if (!Array.isArray(glossary) || glossary.length === 0) {
      throw new Error('Glossary fixture is empty or malformed.');
    }

    if (appEl) {
      appEl.innerHTML = '';
      const appShell = createAppShell({ entries: glossary });
      appEl.appendChild(appShell.element);
    }
  } catch (error) {
    console.error('Skill Flip: failed to load glossary.', error);
    renderError(appEl, 'Something went wrong loading the glossary data. Please try again later.');
  }
}

void bootstrap();
