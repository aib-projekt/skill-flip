import { createLearnMode } from './LearnMode';
import type { LearnModeInstance } from './LearnMode';
import { createBrowseGrid } from './BrowseGrid';
import type { BrowseGridInstance } from './BrowseGrid';
import type { Glossary } from '../types/glossary';

/**
 * AppShell — final integration point tying together all UI groups.
 *
 * Per the spec-audit correction, AppShell owns ONLY:
 *   - the bottom tab bar (`.bottombar` with two `.tab-btn` elements: Learn/Browse)
 *   - the outer container's max-width variant (`.app-shell` 480px for Learn,
 *     `.app-shell.wide` 900px for Browse)
 *
 * It does NOT render a shared topbar — each mounted view (LearnMode,
 * BrowseGrid) supplies its own, per Groups 4/5.
 *
 * Active-tab state lives in memory only (no persistence, no URL/hash).
 * Switching tabs is a manual show/hide of two top-level view containers;
 * LearnMode's actual progress lives in localStorage (Group 3/5), so
 * switching tabs never tears it down or loses it.
 */

export type AppShellTab = 'learn' | 'browse';

export interface CreateAppShellOptions {
  entries: Glossary;
}

export interface AppShellState {
  activeTab: AppShellTab;
}

export interface AppShellInstance {
  /** Root DOM node — append this into the page. */
  element: HTMLElement;
  /** Returns a shallow copy of the current AppShellState. */
  getState: () => AppShellState;
  /** Tears down nested view instances and listeners owned by this instance. */
  destroy: () => void;
}

export function createAppShell(options: CreateAppShellOptions): AppShellInstance {
  const { entries } = options;

  const state: AppShellState = { activeTab: 'learn' };

  const root = document.createElement('div');
  root.className = 'app-shell';

  // --- View containers (manual show/hide, both mounted once) --------------
  const learnContainer = document.createElement('div');
  learnContainer.className = 'view-container view-learn';

  const browseContainer = document.createElement('div');
  browseContainer.className = 'view-container view-browse';

  const learnMode: LearnModeInstance = createLearnMode({ entries });
  learnContainer.appendChild(learnMode.element);

  const browseGrid: BrowseGridInstance = createBrowseGrid({ entries });
  browseContainer.appendChild(browseGrid.element);

  // --- Bottom tab bar -------------------------------------------------------
  const bottombar = document.createElement('nav');
  bottombar.className = 'bottombar';

  const learnTabBtn = document.createElement('button');
  learnTabBtn.type = 'button';
  learnTabBtn.className = 'tab-btn';
  learnTabBtn.textContent = 'Learn';

  const browseTabBtn = document.createElement('button');
  browseTabBtn.type = 'button';
  browseTabBtn.className = 'tab-btn';
  browseTabBtn.textContent = 'Browse';

  bottombar.append(learnTabBtn, browseTabBtn);

  root.append(learnContainer, browseContainer, bottombar);

  // --- Rendering -------------------------------------------------------------
  function render(): void {
    const isLearn = state.activeTab === 'learn';

    learnContainer.style.display = isLearn ? '' : 'none';
    browseContainer.style.display = isLearn ? 'none' : '';

    learnTabBtn.classList.toggle('active', isLearn);
    browseTabBtn.classList.toggle('active', !isLearn);

    // Outer container width variant: 480px (Learn, default `.app-shell`) vs
    // 900px "wide" (Browse, `.app-shell.wide`).
    root.classList.toggle('wide', !isLearn);

    if (!isLearn) {
      // Progress may have changed while in Learn Mode; refresh Browse's own
      // topbar stats when it becomes visible.
      browseGrid.refreshStats();
    }
  }

  function switchTo(tab: AppShellTab): void {
    if (state.activeTab === tab) return;
    state.activeTab = tab;
    render();
  }

  learnTabBtn.addEventListener('click', () => switchTo('learn'));
  browseTabBtn.addEventListener('click', () => switchTo('browse'));

  // Wire LearnMode's exit-to-Browse affordance (Group 5 left this as a
  // documented no-op placeholder) to actually trigger the Browse tab switch.
  const exitBtn = learnMode.element.querySelector<HTMLElement>('.icon-btn[aria-label="Exit Learn Mode"]');
  exitBtn?.addEventListener('click', () => switchTo('browse'));

  render();

  return {
    element: root,
    getState: () => ({ ...state }),
    destroy: () => {
      learnMode.destroy();
      browseGrid.destroy();
    },
  };
}
