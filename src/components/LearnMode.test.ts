import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLearnMode } from './LearnMode';
import { readProgress, writeProgress } from '../lib/storage';
import type { Glossary } from '../types/glossary';

function makeEntry(id: string, term = id): Glossary[number] {
  return {
    id,
    term,
    description: `${term} description`,
    translationPl: `${term} pl`,
    descriptionPl: `${term} opis`,
    category: 'Java',
    level: 'Regular',
  };
}

const entries: Glossary = [makeEntry('a'), makeEntry('b'), makeEntry('c')];

function flipCurrentCard(root: HTMLElement): void {
  const front = root.querySelector<HTMLElement>('.card-front .flip-trigger');
  front?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('LearnMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mounts and draws a card immediately with no setup/session step required', () => {
    const learnMode = createLearnMode({ entries });

    // Always-resumable: a card is drawn and rendered as soon as the
    // component is created, with no "start session" gate to click through.
    expect(learnMode.element.querySelector('.card-shell')).not.toBeNull();
    expect(learnMode.element.querySelector('.term')?.textContent).toBeTruthy();
  });

  it('renders .mark-row only when the current card is flipped', () => {
    const learnMode = createLearnMode({ entries });

    expect(learnMode.element.querySelector('.mark-row')).toBeNull();

    flipCurrentCard(learnMode.element);

    const markRow = learnMode.element.querySelector('.mark-row');
    expect(markRow).not.toBeNull();
    expect(markRow?.querySelector('.mark-btn.know')).not.toBeNull();
    expect(markRow?.querySelector('.mark-btn.dont-know')).not.toBeNull();
  });

  it('marking "Know it" persists via storage.ts and advances to a new drawn card', () => {
    const learnMode = createLearnMode({ entries });
    const shownId = learnMode.getState().currentEntry.id;

    flipCurrentCard(learnMode.element);
    const knowBtn = learnMode.element.querySelector<HTMLElement>('.mark-btn.know');
    knowBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const progress = readProgress();
    expect(progress[shownId]).toEqual({ bucket: 'unseen', consecutiveKnowCount: 1 });

    // Advances to a new weighted-drawn card (card view resets to unflipped).
    expect(learnMode.element.querySelector('.mark-row')).toBeNull();
  });

  it('marking "Don\'t know" persists demotion via storage.ts and advances to a new card', () => {
    const learnMode = createLearnMode({ entries });
    const shownId = learnMode.getState().currentEntry.id;

    flipCurrentCard(learnMode.element);
    const dontKnowBtn = learnMode.element.querySelector<HTMLElement>('.mark-btn.dont-know');
    dontKnowBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const progress = readProgress();
    expect(progress[shownId]).toEqual({ bucket: 'dont_know', consecutiveKnowCount: 0 });

    expect(learnMode.element.querySelector('.mark-row')).toBeNull();
  });

  it('progress-stats header reflects live computeBucketCounts output after a mark', () => {
    const learnMode = createLearnMode({ entries });

    const statsBefore = learnMode.element.querySelector('.progress-stats');
    expect(statsBefore?.textContent).toContain('0 shaky');
    expect(statsBefore?.textContent).toContain('3 new');

    const shownId = learnMode.getState().currentEntry.id;
    flipCurrentCard(learnMode.element);
    learnMode.element
      .querySelector<HTMLElement>('.mark-btn.dont-know')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Sanity: the marked entry really did move buckets.
    expect(readProgress()[shownId]?.bucket).toBe('dont_know');

    const statsAfter = learnMode.element.querySelector('.progress-stats');
    expect(statsAfter?.textContent).toContain('1 shaky');
    expect(statsAfter?.textContent).toContain('2 new');
  });

  it('reset-progress shows a confirmation before calling resetProgress(), and does nothing if declined', () => {
    writeProgress('a', { bucket: 'know', consecutiveKnowCount: 2 });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const learnMode = createLearnMode({ entries });
    const resetBtn = learnMode.element.querySelector<HTMLElement>(
      '.icon-btn[aria-label="Reset progress"]'
    );
    expect(resetBtn).not.toBeNull();

    resetBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(confirmSpy).toHaveBeenCalled();
    // Declined confirmation -> progress untouched.
    expect(readProgress().a).toEqual({ bucket: 'know', consecutiveKnowCount: 2 });

    confirmSpy.mockReturnValue(true);
    resetBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(readProgress()).toEqual({});

    confirmSpy.mockRestore();
  });
});
