import { computeBucketCounts } from '../lib/storage';
import type { Glossary } from '../types/glossary';

/**
 * Renders the shared "N mastered · N shaky · N new" progress-stats markup
 * into `container`, replacing its previous content. Used independently by
 * both Learn Mode's and Browse's own topbars (spec-audit Finding 2/4: each
 * view renders its own topbar, but the stats format and the underlying
 * `computeBucketCounts` computation are shared, not duplicated).
 */
export function renderProgressStats(container: HTMLElement, entries: Glossary): void {
  const counts = computeBucketCounts(entries);
  container.replaceChildren();

  const know = document.createElement('span');
  know.className = 'stat know';
  know.textContent = `${counts.mastered} mastered`;

  const dot1 = document.createElement('span');
  dot1.className = 'dot';
  dot1.textContent = '·';

  const dontKnow = document.createElement('span');
  dontKnow.className = 'stat dontknow';
  dontKnow.textContent = `${counts.shaky} shaky`;

  const dot2 = document.createElement('span');
  dot2.className = 'dot';
  dot2.textContent = '·';

  const unseen = document.createElement('span');
  unseen.className = 'stat unseen';
  unseen.textContent = `${counts.new} new`;

  container.append(know, dot1, dontKnow, dot2, unseen);
}
