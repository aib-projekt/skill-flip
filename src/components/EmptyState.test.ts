import { describe, it, expect, vi } from 'vitest';
import { createEmptyState } from './EmptyState';

describe('createEmptyState', () => {
  it('renders .empty-state root with icon, heading, body, and action button', () => {
    const el = createEmptyState({
      heading: 'No terms match',
      body: 'Try clearing a filter or search a different term.',
      actionLabel: 'Clear filters',
      onAction: () => {},
    });

    expect(el.classList.contains('empty-state')).toBe(true);

    const icon = el.querySelector('.empty-icon');
    expect(icon).not.toBeNull();
    expect(icon?.textContent).toBe('\u{1F50D}');

    const heading = el.querySelector('h2');
    expect(heading?.textContent).toBe('No terms match');

    const body = el.querySelector('p');
    expect(body?.textContent).toBe('Try clearing a filter or search a different term.');

    const actionBtn = el.querySelector('button.clear-btn');
    expect(actionBtn).not.toBeNull();
    expect(actionBtn?.textContent).toBe('Clear filters');
  });

  it('invokes onAction exactly once when the action button is clicked', () => {
    const onAction = vi.fn();
    const el = createEmptyState({
      heading: 'No terms match',
      body: 'Try clearing a filter or search a different term.',
      actionLabel: 'Clear filters',
      onAction,
    });

    const actionBtn = el.querySelector<HTMLButtonElement>('button.clear-btn');
    actionBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
