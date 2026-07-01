import { createCard, categoryBadgeClass } from './Card';
import { createFilterBar } from './FilterBar';
import { applyFilters } from '../lib/filters';
import type { BrowseFilterState } from '../lib/filters';
import { renderProgressStats } from './progressStats';
import type { Glossary } from '../types/glossary';

/**
 * Browse view (spec Section 3): renders its own topbar (brand + progress-stats,
 * per the spec-audit correction — AppShell does NOT own a shared topbar),
 * mounts `FilterBar`, and renders a responsive grid of flippable `Card`
 * tiles, swapping in an empty state when the filtered result set is empty.
 */

export interface CreateBrowseGridOptions {
  entries: Glossary;
}

export interface BrowseGridInstance {
  element: HTMLElement;
  /** Re-reads progress from localStorage and re-renders the topbar stats (e.g. after a reset elsewhere). */
  refreshStats: () => void;
  destroy: () => void;
}

export function createBrowseGrid(options: CreateBrowseGridOptions): BrowseGridInstance {
  const entries = options.entries;
  let filterState: BrowseFilterState = { searchQuery: '', selectedCategories: [], selectedLevel: 'All' };

  const root = document.createElement('div');
  root.className = 'browse-grid-root';

  // --- Topbar (brand + progress-stats) — Browse's own, not a shared AppShell topbar ---
  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  const brand = document.createElement('span');
  brand.className = 'brand';
  brand.textContent = 'Skill Flip';

  const progressStats = document.createElement('div');
  progressStats.className = 'progress-stats';

  topbar.append(brand, progressStats);

  // --- Result count --------------------------------------------------------
  const resultCount = document.createElement('div');
  resultCount.className = 'result-count';

  // --- Grid / Empty state container --------------------------------------------------------
  const contentContainer = document.createElement('div');
  contentContainer.className = 'browse-content';

  const filterBar = createFilterBar({
    entries,
    onChange: (state) => {
      filterState = state;
      renderContent();
    },
  });

  root.append(topbar, filterBar.element, resultCount, contentContainer);

  function renderEmptyState(): HTMLElement {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.textContent = '\u{1F50D}';

    const heading = document.createElement('h2');
    heading.textContent = 'No terms match';

    const helper = document.createElement('p');
    helper.textContent = 'Try clearing a filter or search a different term.';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-btn';
    clearBtn.textContent = 'Clear filters';
    clearBtn.addEventListener('click', () => {
      filterBar.reset();
    });

    emptyState.append(icon, heading, helper, clearBtn);
    return emptyState;
  }

  function renderGrid(filtered: Glossary): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'grid';

    for (const entry of filtered) {
      grid.appendChild(createTile(entry));
    }

    return grid;
  }

  /**
   * Renders one Browse grid tile: `.tile` (collapsed term-only) that flips
   * in place to `.tile.flipped` (description) on tap — the mockup's flat
   * tile structure, not the full 3D card-shell chrome used by Learn Mode's
   * single-card view. Uses `createCard` (`variant: 'tile'`) as the
   * underlying flip-state engine (`CardViewState.isFlipped`) per step
   * 4.3's "renders `.grid` of `Card` instances in `'tile'` variant" — this
   * wrapper re-projects that same state onto the mockup's flat
   * `.tile`/`.tile-hint`/`.tile-desc` markup instead of Card's own
   * `.card-shell`/`.card-front`/`.card-back` DOM, since grid tiles need no
   * Prev/Next/swipe/translation-toggle chrome (Card's own DOM is never
   * mounted into the page for tiles — only its state machine is reused).
   */
  function createTile(entry: Glossary[number]): HTMLElement {
    const card = createCard({ entry, variant: 'tile' });

    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.tabIndex = 0;

    function render(): void {
      const flipped = card.getState().isFlipped;
      tile.classList.toggle('flipped', flipped);
      tile.innerHTML = '';

      const badge = document.createElement('span');
      badge.className = `badge ${categoryBadgeClass(entry.category)}`;
      badge.textContent = entry.category;
      tile.appendChild(badge);

      if (flipped) {
        const desc = document.createElement('p');
        desc.className = 'tile-desc';
        desc.textContent = entry.description;
        tile.appendChild(desc);
      } else {
        const term = document.createElement('h3');
        term.textContent = entry.term;
        tile.appendChild(term);

        const hint = document.createElement('p');
        hint.className = 'tile-hint';
        hint.textContent = 'tap to flip';
        tile.appendChild(hint);
      }
    }

    function toggle(): void {
      // Card exposes flip only via its own DOM trigger, not a public
      // toggle method; its front/back flip-triggers are functionally
      // identical (both call the same internal toggleFlip), so dispatching
      // on the front trigger flips state regardless of current side.
      const trigger = card.element.querySelector<HTMLElement>('.flip-trigger');
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      render();
    }

    tile.addEventListener('click', toggle);
    tile.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });

    render();
    return tile;
  }

  function renderContent(): void {
    const filtered = applyFilters(entries, filterState);

    resultCount.textContent = `${filtered.length} of ${entries.length} terms`;

    contentContainer.innerHTML = '';
    if (filtered.length === 0) {
      contentContainer.appendChild(renderEmptyState());
    } else {
      contentContainer.appendChild(renderGrid(filtered));
    }
  }

  renderProgressStats(progressStats, entries);
  renderContent();

  return {
    element: root,
    refreshStats: () => renderProgressStats(progressStats, entries),
    destroy: () => {
      filterBar.destroy();
    },
  };
}
