# Problem Statement

## TL;DR
Learn Mode should draw only from the category/level subset currently active in Browse, and that subset should persist in `localStorage` across sessions (search text excluded). This deliberately reverses the original design's decision to keep Browse and Learn Mode decoupled — the requester supplied the missing evidence (focused-study friction + repetitive re-filtering) that the original decision said didn't exist.

## Key Decisions
- Persist via `localStorage`, mirroring `storage.ts`'s existing convention exactly — no cookies, no new mechanism.
- Only category + level persist across sessions; search text is session-only and does not persist.
- Learn Mode automatically reflects Browse's active category/level filter — no separate "confirm subset" step.
- Zero-match filter combinations show a visible empty state with a broaden/clear action (consistent with Browse's existing pattern), rather than silently falling back to the full glossary or blocking the filter from being set.
- Learn Mode shows a visible indicator of the active filter, with a quick clear action available without returning to Browse.

## Open Questions / Risks
- This is a conscious reversal of a documented prior product decision (see `analysis/design-context.md`) — flagged and confirmed with the requester, not silently overridden.
- Learn progress remains keyed by entry `id`, so progress persists across filter changes (a card learned under one filter stays "known" after switching filters) — confirmed as intended, not a bug.
- Exact placement/visual design of the active-filter indicator and its quick-clear control is deferred to Phase 6 (Specification) / Phase 7 (Visual Prototyping).

---

## Problem Statement

Learn Mode currently draws from the entire 159-entry glossary regardless of what the user is focused on. Users who want to concentrate on one topic area (e.g. only Java, or only Senior-level Spring/JEE) have no way to narrow Learn Mode's scope, and even Browse's own filter resets on every reload — forcing the same filter to be re-applied every session. This creates friction for focused study sessions and works against the app's "short, frequent mobile study sessions" usage pattern (per `personas.md` in the original design task).

This is a conscious, evidence-based reversal of the original design's explicit decision (`feature-spec.md` Section 3, `analysis/design-context.md` this task) to keep Browse and Learn Mode decoupled and not persist filters — that decision assumed "no evidence a remember-my-filter feature is needed," and this request supplies that evidence directly from the requester: focused-topic study sessions, and the annoyance of re-setting the same filter every day.

## Constraints

- **Persistence mechanism**: `localStorage`, mirroring the existing `storage.ts` convention exactly (key naming style, defensive `JSON.parse` with safe fallback on corrupt/missing data) — no cookies, no new persistence mechanism introduced.
- **Persisted scope**: only `selectedCategories` and `selectedLevel` persist across sessions. `searchQuery` does NOT persist — it resets every session, staying a one-off, in-session-only tool.
- **Coupling model**: automatic, always-in-sync — whatever category/level filter is currently active in Browse is what Learn Mode uses. No explicit "start learning this subset" confirmation step.
- **Empty-subset handling**: if the active filter matches zero entries, Learn Mode shows a visible empty state with a clear/broaden action — never silently falls back to the full glossary, and never blocks the filter combination from being set in Browse.
- **Visibility**: Learn Mode must show an indicator of the currently active filter (e.g. what category/level is active) and offer a quick way to clear it without navigating back to Browse.
- **Technical constraints**: no backend, no new runtime dependencies (the project has zero today) — implementation must be vanilla TypeScript matching the existing factory-function component pattern (`{element, getState, destroy}`) and the `src/components/` (stateful) vs. `src/lib/` (pure) architectural split.
- **Progress-tracking constraint**: Learn Mode's existing bucket-weighted draw algorithm and progress persistence (keyed by entry `id`) must be unaffected — progress persists across filter changes by design.

## Success Criteria

- Filtering to a topic subset in Browse (e.g. category = "Java", level = "Senior") and switching to Learn Mode shows only cards from that subset.
- Reloading the app in a new session preserves the category/level filter without requiring re-selection; any previously typed search text does not carry over.
- A zero-match filter combination produces a clear, actionable empty state in Learn Mode rather than a confusing blank screen.
- Existing bucket-weighted progress tracking (know/don't-know/unseen buckets, graduation threshold) continues to work exactly as today, scoped to whichever subset is active.
- All 31 existing tests continue to pass with no regressions; new tests cover filter persistence (`storage.ts`) and the Learn Mode/filter coupling (`LearnMode.ts`, `AppShell.ts`).

## Key Assumptions

- The requester (also the sole active user) is the primary audience for this change; the Recruiter/Visitor persona's "browse without reading instructions" journey (from the original design) is not materially affected, since Browse's own filter UI and behavior remain unchanged — only its *persistence* and its *reach into Learn Mode* are new.
- "Remembering the filter" means surviving a page reload / new browser session, not cross-device sync (consistent with the existing no-sync-by-design `localStorage` approach for progress).
