import { describe, it, expect, vi } from 'vitest';
import { createCard } from './Card';
import type { GlossaryEntry } from '../types/glossary';

const entryA: GlossaryEntry = {
  id: 'java-generics',
  term: 'Generics',
  description: 'Type parameters that allow classes and methods to operate on typed objects.',
  translationPl: 'Generyki',
  descriptionPl: 'Parametry typu pozwalające klasom i metodom operować na typowanych obiektach.',
  category: 'Java',
  level: 'Regular',
};

const entryB: GlossaryEntry = {
  id: 'java-streams',
  term: 'Streams API',
  description: 'A sequence of elements supporting functional-style operations.',
  translationPl: 'Streams API',
  descriptionPl: 'Sekwencja elementów wspierająca operacje w stylu funkcyjnym.',
  category: 'Java',
  level: 'Regular',
};

describe('Card', () => {
  it('toggles isFlipped state on click/tap of the card face', () => {
    const card = createCard({ entry: entryA });
    expect(card.getState().isFlipped).toBe(false);

    const front = card.element.querySelector<HTMLElement>('.card-front .flip-trigger');
    front?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(card.getState().isFlipped).toBe(true);

    // Once flipped, the back face's own flip-trigger is the tappable surface.
    const back = card.element.querySelector<HTMLElement>('.card-back .flip-trigger');
    back?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(card.getState().isFlipped).toBe(false);
  });

  it('toggles isFlipped on spacebar keypress when the card has focus', () => {
    const card = createCard({ entry: entryA });
    const shell = card.element.querySelector<HTMLElement>('.card-shell');
    expect(shell).toBeTruthy();

    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(card.getState().isFlipped).toBe(true);

    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(card.getState().isFlipped).toBe(false);
  });

  it('renders both front and back faces in the DOM regardless of flip state', () => {
    const card = createCard({ entry: entryA });

    expect(card.element.querySelector('.card-front')).not.toBeNull();
    expect(card.element.querySelector('.card-back')).not.toBeNull();

    const shell = card.element.querySelector<HTMLElement>('.card-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(card.getState().isFlipped).toBe(true);
    expect(card.element.querySelector('.card-front')).not.toBeNull();
    expect(card.element.querySelector('.card-back')).not.toBeNull();
  });

  it('renders the flip trigger as a real <button> element, not a clickable div', () => {
    const card = createCard({ entry: entryA });
    const trigger = card.element.querySelector('.flip-trigger');

    expect(trigger).not.toBeNull();
    expect(trigger?.tagName).toBe('BUTTON');
  });

  it('toggles isTranslationVisible independently of isFlipped, preserving state across flip/unflip', () => {
    const card = createCard({ entry: entryA });
    expect(card.getState().isTranslationVisible).toBe(false);

    const infoBtn = card.element.querySelector<HTMLElement>('.info-btn');
    infoBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(card.getState().isTranslationVisible).toBe(true);
    expect(card.getState().isFlipped).toBe(false);

    // Flipping should not reset translation visibility.
    const shell = card.element.querySelector<HTMLElement>('.card-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(card.getState().isFlipped).toBe(true);
    expect(card.getState().isTranslationVisible).toBe(true);

    // Un-flipping and re-flipping preserves the last translation-toggle state.
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(card.getState().isFlipped).toBe(true);
    expect(card.getState().isTranslationVisible).toBe(true);
  });

  it('fires Prev/Next navigation callbacks with the correct direction and resets CardViewState for the new entry', () => {
    const onNavigate = vi.fn();
    const card = createCard({ entry: entryA, onNavigate });

    // Flip and toggle translation, then navigate — new entry's view state should reset.
    const shell = card.element.querySelector<HTMLElement>('.card-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    const infoBtn = card.element.querySelector<HTMLElement>('.info-btn');
    infoBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(card.getState().isFlipped).toBe(true);
    expect(card.getState().isTranslationVisible).toBe(true);

    const nextBtn = card.element.querySelector<HTMLElement>('[aria-label="Next card"]');
    nextBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onNavigate).toHaveBeenCalledWith('next');

    card.setEntry(entryB);
    expect(card.getState().currentEntry).toBe(entryB);
    expect(card.getState().isFlipped).toBe(false);
    expect(card.getState().isTranslationVisible).toBe(false);

    const prevBtn = card.element.querySelector<HTMLElement>('[aria-label="Previous card"]');
    prevBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onNavigate).toHaveBeenCalledWith('prev');
  });
});
