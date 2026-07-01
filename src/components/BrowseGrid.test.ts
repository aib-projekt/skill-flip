import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowseGrid } from './BrowseGrid';
import type { Glossary } from '../types/glossary';

const fixture: Glossary = [
  {
    id: 'java-generics',
    term: 'Generics',
    description: 'Type parameters that allow classes and methods to operate on typed objects.',
    translationPl: 'Generyki',
    descriptionPl: 'Parametry typu pozwalające klasom i metodom operować na typowanych obiektach.',
    category: 'Java',
    level: 'Regular',
  },
  {
    id: 'java-jvm-memory-model',
    term: 'JVM Memory Model',
    description: 'How the JVM organizes heap, stack, and metaspace memory.',
    translationPl: 'Model pamięci JVM',
    descriptionPl: 'Sposób w jaki JVM organizuje pamięć sterty, stosu i metaspace.',
    category: 'Java',
    level: 'Senior',
  },
  {
    id: 'devops-ci-cd',
    term: 'CI/CD Pipeline',
    description: 'Automated build, test, and deployment workflow.',
    translationPl: 'Potok CI/CD',
    descriptionPl: 'Zautomatyzowany proces budowania, testowania i wdrażania.',
    category: 'DevOps',
    level: 'Regular',
  },
  {
    id: 'devops-containers',
    term: 'Containers',
    description: 'Lightweight, isolated units for packaging and running applications.',
    translationPl: 'Kontenery',
    descriptionPl: 'Lekkie, izolowane jednostki do pakowania i uruchamiania aplikacji.',
    category: 'DevOps',
    level: 'Junior',
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('BrowseGrid / FilterBar integration', () => {
  it('debounces search input 200ms before applying the filter and re-rendering the grid', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');
    expect(search).not.toBeNull();

    search!.value = 'generics';
    search!.dispatchEvent(new Event('input', { bubbles: true }));

    // Not yet applied before the debounce window elapses.
    vi.advanceTimersByTime(199);
    expect(grid.element.querySelectorAll('.tile').length).toBe(4);

    // Applied once the debounce window elapses.
    vi.advanceTimersByTime(1);
    expect(grid.element.querySelectorAll('.tile').length).toBe(1);
    expect(grid.element.textContent).toContain('Generics');
  });

  it('toggling a category chip updates the multi-select filter state and re-renders the grid', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const devopsChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    );
    expect(devopsChip).toBeTruthy();

    devopsChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Chip toggling rebuilds the chip DOM, so re-query rather than reuse
    // the pre-click element reference.
    const devopsChipAfter = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    );
    expect(devopsChipAfter!.classList.contains('active')).toBe(true);
    expect(grid.element.querySelectorAll('.tile').length).toBe(2);
    expect(grid.element.textContent).toContain('CI/CD Pipeline');
    expect(grid.element.textContent).not.toContain('Generics');
  });

  it('level segmented control selection narrows results correctly', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const juniorBtn = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    expect(juniorBtn).toBeTruthy();

    juniorBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Level toggling rebuilds the segmented-control DOM, so re-query rather
    // than reuse the pre-click element reference.
    const juniorBtnAfter = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    expect(juniorBtnAfter!.classList.contains('active')).toBe(true);
    expect(grid.element.querySelectorAll('.tile').length).toBe(1);
    expect(grid.element.textContent).toContain('Containers');
  });

  it('renders the result count as "N of {dataset.length} terms" using the actual loaded array length', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const resultCount = grid.element.querySelector('.result-count');
    expect(resultCount?.textContent).toBe(`${fixture.length} of ${fixture.length} terms`);

    const juniorBtn = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    juniorBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(grid.element.querySelector('.result-count')?.textContent).toBe(`1 of ${fixture.length} terms`);
  });

  it('renders the empty state when filters yield zero matches and removes it once a match exists again', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');

    search!.value = 'no-such-term-anywhere';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(grid.element.querySelector('.empty-state')).not.toBeNull();
    expect(grid.element.querySelector('.grid')).toBeNull();
    expect(grid.element.textContent).toContain('No terms match');

    search!.value = '';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(grid.element.querySelector('.empty-state')).toBeNull();
    expect(grid.element.querySelector('.grid')).not.toBeNull();
  });

  it('"Clear filters" resets all filter state and restores the full unfiltered grid', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');

    search!.value = 'no-such-term-anywhere';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const clearBtn = grid.element.querySelector<HTMLElement>('.clear-btn');
    expect(clearBtn).not.toBeNull();
    clearBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(grid.element.querySelector('.empty-state')).toBeNull();
    expect(grid.element.querySelectorAll('.tile').length).toBe(fixture.length);
    expect(grid.element.querySelector<HTMLInputElement>('.search-input')?.value).toBe('');
    expect(grid.element.querySelector('.result-count')?.textContent).toBe(
      `${fixture.length} of ${fixture.length} terms`
    );
  });
});
