import type { Glossary } from './types/glossary';

/**
 * Scaffolding-stage bootstrap. Fetches the glossary fixture and logs the
 * entry count so `npm run dev` / `npm run build` have a working, verifiable
 * app shell during Groups 2-6. The real `AppShell` mount replaces this in
 * Group 6.
 */
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

    console.log(`Skill Flip: loaded ${glossary.length} glossary entries.`);

    if (appEl) {
      appEl.textContent = `Skill Flip scaffold: loaded ${glossary.length} glossary entries.`;
    }
  } catch (error) {
    console.error('Skill Flip: failed to load glossary.', error);
    if (appEl) {
      appEl.textContent = 'Skill Flip: failed to load glossary data.';
    }
  }
}

void bootstrap();
