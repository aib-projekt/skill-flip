import { describe, it, expect, beforeEach } from 'vitest';
import { createAppShell } from './AppShell';
import { writeProgress, readProgress } from '../lib/storage';
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

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to the Learn tab active on initial mount', () => {
    const shell = createAppShell({ entries });

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    );
    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    );

    expect(learnTab?.classList.contains('active')).toBe(true);
    expect(browseTab?.classList.contains('active')).toBe(false);

    // Learn Mode content is visible; Browse content is not present/visible.
    expect(shell.element.querySelector('.learn-stage')).not.toBeNull();
    expect(shell.element.classList.contains('app-shell')).toBe(true);
    expect(shell.element.classList.contains('wide')).toBe(false);
  });

  it('clicking the Browse tab swaps visible content to BrowseGrid and applies the 900px wide container variant', () => {
    const shell = createAppShell({ entries });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(shell.element.classList.contains('wide')).toBe(true);
    expect(shell.element.querySelector('.browse-grid-root')).not.toBeNull();
    expect(shell.element.querySelector('.filter-bar')).not.toBeNull();

    const browseTabAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    const learnTabAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    expect(browseTabAfter.classList.contains('active')).toBe(true);
    expect(learnTabAfter.classList.contains('active')).toBe(false);
  });

  it('clicking the Learn tab swaps back to LearnMode and applies the 480px container variant', () => {
    const shell = createAppShell({ entries });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(shell.element.classList.contains('wide')).toBe(true);

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    learnTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(shell.element.classList.contains('wide')).toBe(false);
    expect(shell.element.querySelector('.learn-stage')).not.toBeNull();

    const learnTabAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    expect(learnTabAfter.classList.contains('active')).toBe(true);
  });

  it('switching tabs does not trigger a page reload or alter window.location', () => {
    const originalHref = window.location.href;
    const shell = createAppShell({ entries });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    learnTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(window.location.href).toBe(originalHref);
    expect(window.location.hash).toBe('');
  });

  it('preserves Learn Mode progress written to localStorage after switching to Browse and back', () => {
    const shell = createAppShell({ entries });

    // Simulate a progress write that happened while Learn Mode was active.
    writeProgress('a', { bucket: 'know', consecutiveKnowCount: 1 });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    learnTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(readProgress().a).toEqual({ bucket: 'know', consecutiveKnowCount: 1 });
  });
});
