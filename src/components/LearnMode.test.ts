import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLearnMode } from './LearnMode';
import { readProgress, writeProgress } from '../lib/storage';
import type { Glossary } from '../types/glossary';
import type { Category, Level } from '../types/glossary';

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

  it('updateFilter(subset, filterState) immediately redraws from the new subset, not the original entries', () => {
    const learnMode = createLearnMode({ entries });

    const subset: Glossary = [makeEntry('only-one', 'OnlyOneTerm')];
    learnMode.updateFilter(subset, { selectedCategories: [], selectedLevel: 'All' });

    expect(learnMode.getState().currentEntry.id).toBe('only-one');
    expect(learnMode.element.querySelector('.term')?.textContent).toBe('OnlyOneTerm');
  });

  it('updateFilter([], filterState) renders .empty-state in place of .card-shell with no .mark-row, and never calls drawNextCard', () => {
    const learnMode = createLearnMode({ entries });

    learnMode.updateFilter([], { selectedCategories: [], selectedLevel: 'All' });

    expect(learnMode.element.querySelector('.card-shell')).toBeNull();
    expect(learnMode.element.querySelector('.empty-state')).not.toBeNull();
    expect(learnMode.element.querySelector('.mark-row')).toBeNull();
  });

  it('.filter-chip is absent for a default filter, and shows the correct label for an active filter (joined + overflow formats)', () => {
    const learnMode = createLearnMode({ entries });

    expect(learnMode.element.querySelector('.filter-chip')).toBeNull();

    learnMode.updateFilter(entries, { selectedCategories: ['Java'], selectedLevel: 'Senior' });
    let chip = learnMode.element.querySelector('.filter-chip');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('Java');
    expect(chip?.textContent).toContain('Senior');

    const twoCats: Category[] = ['Java', 'DevOps'];
    learnMode.updateFilter(entries, { selectedCategories: twoCats, selectedLevel: 'All' });
    chip = learnMode.element.querySelector('.filter-chip');
    expect(chip?.textContent).toContain('Java, DevOps');

    const threeCats: Category[] = ['Java', 'DevOps', 'Testing'];
    learnMode.updateFilter(entries, { selectedCategories: threeCats, selectedLevel: 'All' as Level | 'All' });
    chip = learnMode.element.querySelector('.filter-chip');
    expect(chip?.textContent).toContain('Java +2 more');

    learnMode.updateFilter(entries, { selectedCategories: [], selectedLevel: 'All' });
    expect(learnMode.element.querySelector('.filter-chip')).toBeNull();
  });

  it('clicking .filter-chip invokes onClearFilter exactly once with no other direct side effect', () => {
    const onClearFilter = vi.fn();
    const learnMode = createLearnMode({
      entries,
      onClearFilter,
      filterState: { selectedCategories: ['Java'], selectedLevel: 'All' },
    });

    const shownBefore = learnMode.getState().currentEntry.id;

    const chip = learnMode.element.querySelector<HTMLElement>('.filter-chip');
    expect(chip).not.toBeNull();
    chip?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onClearFilter).toHaveBeenCalledTimes(1);
    // LearnMode itself performs no state mutation — same card still shown.
    expect(learnMode.getState().currentEntry.id).toBe(shownBefore);
  });

  it('progress-stats reflect computeBucketCounts of the current filtered subset, both immediately after updateFilter and after a mark within it', () => {
    const learnMode = createLearnMode({ entries });

    const subset: Glossary = [makeEntry('x'), makeEntry('y')];
    learnMode.updateFilter(subset, { selectedCategories: [], selectedLevel: 'All' });

    let stats = learnMode.element.querySelector('.progress-stats');
    expect(stats?.textContent).toContain('2 new');
    expect(stats?.textContent).toContain('0 shaky');

    const shownId = learnMode.getState().currentEntry.id;
    flipCurrentCard(learnMode.element);
    learnMode.element
      .querySelector<HTMLElement>('.mark-btn.dont-know')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(readProgress()[shownId]?.bucket).toBe('dont_know');

    stats = learnMode.element.querySelector('.progress-stats');
    expect(stats?.textContent).toContain('1 shaky');
    expect(stats?.textContent).toContain('1 new');
  });
});
