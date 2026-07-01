import { createCard } from './Card';
import type { CardInstance } from './Card';
import { drawNextCard, applyMark } from '../lib/learnAlgorithm';
import type { Mark } from '../lib/learnAlgorithm';
import { readProgress, writeProgress, resetProgress } from '../lib/storage';
import { renderProgressStats } from './progressStats';
import type { Glossary, GlossaryEntry } from '../types/glossary';

/**
 * Learn Mode view (spec Section 4 + spec-audit corrected AppShell boundary).
 *
 * Renders its OWN topbar (exit-to-browse icon + `.progress-stats` +
 * reset-progress icon) — AppShell owns only the bottom tab bar and outer
 * container width variant, per the spec-audit correction. Always-resumable:
 * a weighted-drawn card is shown as soon as this component mounts, with no
 * "start session" gate.
 *
 * Mounts a single `Card` (`variant: 'full'`) fed by `learnAlgorithm`'s
 * weighted draw. Prev/Next nav from Card re-draws a new weighted card
 * (Prev/Next don't step through prior history — Learn Mode has no queue,
 * only a live weighted draw excluding the immediately-previous card).
 * Marking "Know it"/"Don't know" (via the swipe gesture on Card, or the
 * `.mark-row` buttons rendered here once flipped) writes progress
 * immediately via `storage.ts`, then draws the next card.
 */

export interface CreateLearnModeOptions {
  entries: Glossary;
}

export interface LearnModeState {
  currentEntry: GlossaryEntry;
}

export interface LearnModeInstance {
  /** Root DOM node — append this into the page. */
  element: HTMLElement;
  /** Returns a shallow copy of the current LearnModeState. */
  getState: () => LearnModeState;
  /** Tears down listeners owned by this instance (not by the nested Card). */
  destroy: () => void;
}

export function createLearnMode(options: CreateLearnModeOptions): LearnModeInstance {
  const { entries } = options;

  let previousId: string | null = null;
  const state: LearnModeState = {
    currentEntry: drawNextCard(entries, readProgress(), previousId),
  };

  // --- Topbar (Learn Mode's own — distinct from Browse's brand+stats bar) --
  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'icon-btn';
  exitBtn.setAttribute('aria-label', 'Exit Learn Mode');
  exitBtn.textContent = '←';

  const progressStats = document.createElement('div');
  progressStats.className = 'progress-stats';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'icon-btn';
  resetBtn.setAttribute('aria-label', 'Reset progress');
  resetBtn.textContent = '↻';

  topbar.append(exitBtn, progressStats, resetBtn);

  // --- Learn stage (single Card in 'full' variant) -------------------------
  const learnStage = document.createElement('main');
  learnStage.className = 'learn-stage';

  let card: CardInstance = createCard({
    entry: state.currentEntry,
    variant: 'full',
    onNavigate: () => advanceToNextCard(),
    onSwipe: (detail) => mark(detail.direction),
  });

  let markRow: HTMLElement | null = null;

  learnStage.appendChild(card.element);

  const root = document.createElement('div');
  root.append(topbar, learnStage);

  // --- Rendering -------------------------------------------------------------
  function renderMarkRow(): void {
    // `.mark-row` is rendered ONLY when the current card is flipped —
    // absent/not interactive on the front face (spec-audit binding
    // acceptance criterion from the back-flipped mockup).
    const isFlipped = card.getState().isFlipped;

    if (isFlipped && !markRow) {
      markRow = document.createElement('div');
      markRow.className = 'mark-row';

      const dontKnowBtn = document.createElement('button');
      dontKnowBtn.type = 'button';
      dontKnowBtn.className = 'mark-btn dont-know';
      dontKnowBtn.textContent = "↓ Don't know";
      dontKnowBtn.addEventListener('click', () => mark('dont_know'));

      const knowBtn = document.createElement('button');
      knowBtn.type = 'button';
      knowBtn.className = 'mark-btn know';
      knowBtn.textContent = '↑ Know it';
      knowBtn.addEventListener('click', () => mark('know'));

      markRow.append(dontKnowBtn, knowBtn);
      learnStage.appendChild(markRow);
    } else if (!isFlipped && markRow) {
      markRow.remove();
      markRow = null;
    }
  }

  // --- Mark + advance logic --------------------------------------------------
  function mark(direction: Mark): void {
    const entry = state.currentEntry;
    const current = readProgress()[entry.id] ?? { bucket: 'unseen', consecutiveKnowCount: 0 };
    const next = applyMark(current, direction);

    // Write-on-every-mark (not just on exit), per Section 4/spec-audit.
    writeProgress(entry.id, next);

    advanceToNextCard();
  }

  function advanceToNextCard(): void {
    previousId = state.currentEntry.id;
    state.currentEntry = drawNextCard(entries, readProgress(), previousId);

    card.setEntry(state.currentEntry);
    renderMarkRow();
    renderProgressStats(progressStats, entries);
  }

  function confirmReset(): void {
    // Native confirm() as the confirmation affordance (copy left to
    // implementation discretion per spec-audit Finding 7).
    const confirmed = window.confirm(
      'Reset all Learn Mode progress? This clears mastered/shaky status for every card.'
    );
    if (!confirmed) return;

    resetProgress();
    renderMarkRow();
    renderProgressStats(progressStats, entries);
  }

  exitBtn.addEventListener('click', () => {
    // Exit-to-browse is a navigation concern owned by AppShell (Group 6);
    // this component only needs to expose the affordance itself.
  });
  resetBtn.addEventListener('click', () => confirmReset());

  // Card's own flip toggling happens inside Card; we re-derive .mark-row
  // visibility by observing state after any interaction that could flip it
  // (click/tap or spacebar). Card doesn't expose a change event, so we hook
  // the same DOM nodes it dispatches on.
  card.element.addEventListener('click', () => renderMarkRow());
  card.element.addEventListener('keydown', (e: Event) => {
    const key = (e as KeyboardEvent).key;
    if (key === ' ' || key === 'Spacebar') renderMarkRow();
  });

  renderProgressStats(progressStats, entries);
  renderMarkRow();

  return {
    element: root,
    getState: () => ({ currentEntry: state.currentEntry }),
    destroy: () => {
      card.destroy();
    },
  };
}
