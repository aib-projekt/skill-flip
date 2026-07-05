/**
 * Shared empty-state component: renders `.empty-state` (icon + heading + body
 * + action button) for use wherever a filtered/empty result set needs a
 * "nothing here, try clearing X" affordance. Extracted from BrowseGrid's
 * former `renderEmptyState()` (spec Section 4) and reused verbatim by Browse
 * and Learn Mode.
 *
 * Both current consumers use the same magnifying-glass icon glyph, so it is
 * hardcoded rather than exposed as an option (per minimal-implementation
 * standard: no speculative props beyond what's needed).
 */

export interface CreateEmptyStateOptions {
  heading: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}

export function createEmptyState(options: CreateEmptyStateOptions): HTMLElement {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';

  const icon = document.createElement('div');
  icon.className = 'empty-icon';
  icon.textContent = '\u{1F50D}';

  const heading = document.createElement('h2');
  heading.textContent = options.heading;

  const helper = document.createElement('p');
  helper.textContent = options.body;

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = options.actionLabel;
  clearBtn.addEventListener('click', () => {
    options.onAction();
  });

  emptyState.append(icon, heading, helper, clearBtn);
  return emptyState;
}
