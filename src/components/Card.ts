import type { GlossaryEntry } from '../types/glossary';

/**
 * Shared flip-card component (spec Section 2).
 *
 * Consumed by both Learn Mode (`variant: 'full'`, single-card view with
 * Prev/Next + swipe-to-mark) and Browse (`variant: 'tile'`, sized-down grid
 * tile with flip-in-place only — no nav row, no swipe).
 *
 * `CardViewState` (`currentEntry`, `isFlipped`, `direction`, `isTranslationVisible`)
 * lives entirely inside this component instance. Navigating to a new entry
 * (`setEntry`) resets `isFlipped` and `isTranslationVisible`; the flip and
 * translation-toggle are otherwise independent of each other.
 */

export type NavDirection = 'prev' | 'next';

export interface CardViewState {
  currentEntry: GlossaryEntry;
  isFlipped: boolean;
  direction: NavDirection | null;
  isTranslationVisible: boolean;
}

export type CardVariant = 'full' | 'tile';

export interface CardSwipeDetail {
  direction: 'know' | 'dont_know';
}

export interface CreateCardOptions {
  entry: GlossaryEntry;
  /** `'full'` for Learn Mode's single-card view, `'tile'` for Browse grid tiles. Defaults to `'full'`. */
  variant?: CardVariant;
  /** Fired when Prev/Next nav is triggered (button or, in 'full' variant, arrow keys). */
  onNavigate?: (direction: NavDirection) => void;
  /** Fired on a completed swipe gesture while `isFlipped === true` (only meaningful for `variant: 'full'`). */
  onSwipe?: (detail: CardSwipeDetail) => void;
}

export interface CardInstance {
  /** Root DOM node — append this into the page. */
  element: HTMLElement;
  /** Returns a shallow copy of the current CardViewState. */
  getState: () => CardViewState;
  /** Swaps in a new entry and resets isFlipped/isTranslationVisible for it. */
  setEntry: (entry: GlossaryEntry) => void;
  /** Tears down listeners (swipe/keydown) attached outside the element itself. */
  destroy: () => void;
}

const SWIPE_MIN_DISTANCE_PX = 40;

export function categoryBadgeClass(category: GlossaryEntry['category']): string {
  return `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

function levelBadgeClass(level: GlossaryEntry['level']): string {
  return `level-${level.toLowerCase()}`;
}

export function createCard(options: CreateCardOptions): CardInstance {
  const variant: CardVariant = options.variant ?? 'full';

  const state: CardViewState = {
    currentEntry: options.entry,
    isFlipped: false,
    direction: null,
    isTranslationVisible: false,
  };

  // --- Root structure -------------------------------------------------
  const shell = document.createElement('div');
  shell.className = variant === 'tile' ? 'card-shell card-shell-tile' : 'card-shell';
  shell.tabIndex = 0;

  // `.card-inner` stays a plain <div> to match the mockup's 3D-flip markup
  // (`.card-shell > .card-inner > .card-face...`, rotated via CSS transform).
  const inner = document.createElement('div');
  inner.className = 'card-inner';
  shell.appendChild(inner);

  // --- Front face -------------------------------------------------------
  const front = document.createElement('div');
  front.className = 'card-face card-front';

  // Flip trigger: a real <button> (not a clickable div) covering the front
  // face's content, so tap/click anywhere on the front flips the card, per
  // Success Criteria. Both faces remain in the DOM at all times regardless
  // of flip state via `backface-visibility: hidden` (never `display:none`).
  const frontFlipTrigger = document.createElement('button');
  frontFlipTrigger.type = 'button';
  frontFlipTrigger.className = 'flip-trigger';
  frontFlipTrigger.setAttribute('aria-label', 'Flip card');

  const catBadge = document.createElement('span');
  catBadge.className = `badge ${categoryBadgeClass(state.currentEntry.category)}`;

  const levelBadge = document.createElement('span');
  levelBadge.className = `badge ${levelBadgeClass(state.currentEntry.level)}`;

  const termEl = document.createElement('h1');
  termEl.className = 'term';

  const flipHint = document.createElement('p');
  flipHint.className = 'flip-hint';
  flipHint.textContent = 'Tap card to reveal definition';

  frontFlipTrigger.append(catBadge, levelBadge, termEl, flipHint);
  front.appendChild(frontFlipTrigger);

  // --- Back face --------------------------------------------------------
  const back = document.createElement('div');
  back.className = 'card-face card-back';

  const backTop = document.createElement('div');
  backTop.className = 'back-top';

  const termSmall = document.createElement('span');
  termSmall.className = 'term-small';

  const infoBtn = document.createElement('button');
  infoBtn.type = 'button';
  infoBtn.className = 'info-btn';
  infoBtn.setAttribute('aria-label', 'Show Polish translation');
  infoBtn.textContent = 'i';

  // `.info-btn` is a sibling of the back-face flip trigger (not nested
  // inside it) so its click toggles translation visibility independently,
  // without fighting HTML's no-nested-<button> rule or event bubbling into
  // the flip trigger.
  backTop.append(termSmall, infoBtn);

  // Back face flip trigger: a real <button> covering the description area
  // (everything on the back except the "(i)" translation toggle), so
  // tap/click anywhere on the back also flips the card back to front.
  const backFlipTrigger = document.createElement('button');
  backFlipTrigger.type = 'button';
  backFlipTrigger.className = 'flip-trigger';
  backFlipTrigger.setAttribute('aria-label', 'Flip card');

  const descriptionEl = document.createElement('p');
  descriptionEl.className = 'description';

  const translationPop = document.createElement('div');
  translationPop.className = 'translation-pop';

  const plTerm = document.createElement('div');
  plTerm.className = 'pl-term';
  const plTermPrefix = document.createTextNode('PL: ');
  const plTermStrong = document.createElement('strong');
  plTerm.append(plTermPrefix, plTermStrong);

  const plDesc = document.createElement('p');
  plDesc.className = 'pl-desc';

  translationPop.append(plTerm, plDesc);
  backFlipTrigger.appendChild(descriptionEl);
  back.append(backTop, backFlipTrigger, translationPop);

  inner.append(front, back);

  // --- Nav row (variant 'full' only) ------------------------------------
  let navRow: HTMLElement | null = null;
  if (variant === 'full') {
    navRow = document.createElement('div');
    navRow.className = 'nav-row';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'nav-btn';
    prevBtn.setAttribute('aria-label', 'Previous card');
    prevBtn.textContent = '← Prev';

    const swipeHint = document.createElement('span');
    swipeHint.className = 'swipe-hint';
    swipeHint.textContent = "swipe ↑ know / ↓ don't know";

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'nav-btn';
    nextBtn.setAttribute('aria-label', 'Next card');
    nextBtn.textContent = 'Next →';

    prevBtn.addEventListener('click', () => navigate('prev'));
    nextBtn.addEventListener('click', () => navigate('next'));

    navRow.append(prevBtn, swipeHint, nextBtn);
  }

  const root = document.createElement('div');
  root.className = variant === 'tile' ? 'card-root card-root-tile' : 'card-root';
  root.appendChild(shell);
  if (navRow) root.appendChild(navRow);

  // --- Rendering ----------------------------------------------------------
  function render(): void {
    const entry = state.currentEntry;

    catBadge.className = `badge ${categoryBadgeClass(entry.category)}`;
    catBadge.textContent = entry.category;

    levelBadge.className = `badge ${levelBadgeClass(entry.level)}`;
    levelBadge.textContent = entry.level;

    termEl.textContent = entry.term;
    termSmall.textContent = entry.term;
    descriptionEl.textContent = entry.description;

    plTermStrong.textContent = entry.translationPl;
    plDesc.textContent = entry.descriptionPl;

    shell.classList.toggle('is-flipped', state.isFlipped);
    inner.classList.toggle('is-flipped', state.isFlipped);
    shell.classList.toggle('card-shell-back', state.isFlipped);

    infoBtn.classList.toggle('active', state.isTranslationVisible);
    translationPop.classList.toggle('is-visible', state.isTranslationVisible);
  }

  // --- Interaction handlers ------------------------------------------------
  function toggleFlip(): void {
    state.isFlipped = !state.isFlipped;
    render();
  }

  function toggleTranslation(): void {
    state.isTranslationVisible = !state.isTranslationVisible;
    render();
  }

  function navigate(direction: NavDirection): void {
    state.direction = direction;
    options.onNavigate?.(direction);
  }

  frontFlipTrigger.addEventListener('click', () => toggleFlip());
  backFlipTrigger.addEventListener('click', () => toggleFlip());

  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTranslation();
  });

  shell.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      toggleFlip();
    }
  });

  // --- Swipe gesture detection (only active once isFlipped === true) -----
  let touchStartY = 0;
  let touchStartX = 0;

  function handleTouchStart(e: TouchEvent): void {
    if (!state.isFlipped) return;
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function handleTouchEnd(e: TouchEvent): void {
    if (!state.isFlipped) return;
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;

    if (Math.abs(deltaY) < SWIPE_MIN_DISTANCE_PX || Math.abs(deltaY) < Math.abs(deltaX)) {
      return;
    }

    if (deltaY < 0) {
      options.onSwipe?.({ direction: 'know' });
    } else {
      options.onSwipe?.({ direction: 'dont_know' });
    }
  }

  shell.addEventListener('touchstart', handleTouchStart, { passive: true });
  shell.addEventListener('touchend', handleTouchEnd, { passive: true });

  render();

  return {
    element: root,
    getState: () => ({ ...state }),
    setEntry: (entry: GlossaryEntry) => {
      state.currentEntry = entry;
      state.isFlipped = false;
      state.isTranslationVisible = false;
      state.direction = null;
      render();
    },
    destroy: () => {
      shell.removeEventListener('touchstart', handleTouchStart);
      shell.removeEventListener('touchend', handleTouchEnd);
    },
  };
}
