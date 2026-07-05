# Product Brief: Learn Mode Respects Browse's Filtered Subset

## TL;DR
Learn Mode will draw only from Browse's active category/level filter, with that filter persisted in `localStorage` across sessions (search text excluded). This is a deliberate, evidence-based reversal of the original design's decision to keep Browse and Learn Mode decoupled — the requester needs focused-topic study sessions without re-filtering every visit. Implementation is a state-lift-up + persistence wiring task at `AppShell`; no changes to the pure-logic layer (`applyFilters`, `drawNextCard`) are needed. Full detail in the linked analysis documents below.

## Key Decisions
- `AppShell` becomes the sole owner/mediator of filter state — `BrowseGrid` and `LearnMode` stay mutually decoupled.
- Persist only `selectedCategories`/`selectedLevel` to `localStorage`, structurally excluding `searchQuery` at the type level.
- Learn Mode gains a dismissible active-filter chip in its topbar and reuses a newly shared `EmptyState` component for the zero-match case.
- Progress-tracking persistence is unaffected (still keyed by entry `id`); the mastered/shaky/new stats now scope to the active filtered subset.

## Open Questions / Risks
- None outstanding — all risks raised during design (documented decision reversal, empty-subset behavior, `LearnMode`'s new "update in place" surface) were resolved during specification.

---

## Layer 0: Core Brief

### Problem Statement
Learn Mode currently draws from the entire 159-entry glossary regardless of what the user is focused on. Users who want to concentrate on one topic area (e.g. only Java, or only Senior-level Spring/JEE) have no way to narrow Learn Mode's scope, and Browse's own filter resets on every reload — forcing the same filter to be re-applied every session. This is a conscious, evidence-based reversal of the original design's explicit decision to keep Browse and Learn Mode decoupled and not persist filters (full detail in `analysis/problem-statement.md`).

### Target Users
The Creator persona (from the original design task, `.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/personas.md`) — a backend/Java engineer doing short, frequent, mobile-first study sessions. This feature is squarely for this persona; the Recruiter/Visitor's Browse-exploration journey is unaffected, since Browse's own UI/behavior is unchanged — only its persistence and reach into Learn Mode are new. (Phase 3 persona exploration was skipped this round since the task is Standard complexity/enhancement scope — the existing personas apply unchanged.)

### Feature Overview
- `AppShell` reads/writes the active category+level filter to `localStorage` (new `readFilterState`/`writeFilterState` functions mirroring the existing progress-persistence convention).
- Filter changes propagate automatically from Browse's `FilterBar` through `BrowseGrid` to `AppShell`, which updates `LearnMode`'s draw pool via a new `updateFilter()` method — no confirmation step.
- Learn Mode shows a dismissible chip (e.g. "Java · Senior ✕") in its topbar when a filter is active, and its mastered/shaky/new stats scope to the active subset.
- A zero-match filter shows a visible, actionable empty state in Learn Mode (reusing a newly-extracted shared `EmptyState` component also adopted by Browse) — never a silent fallback to the full glossary.

(Full section-by-section detail — including exact interfaces, wiring, and code sketches — in `analysis/feature-spec.md`.)

### Constraints
- Persistence via `localStorage` only, mirroring `storage.ts`'s existing convention exactly — no cookies, no new mechanism.
- Only category + level persist across sessions; search text is session-only.
- Automatic, always-in-sync coupling — no explicit "start learning this subset" step.
- No backend, no new runtime dependencies — vanilla TypeScript matching the existing factory-function component pattern.

### Success Criteria
- Filtering to a topic subset in Browse and switching to Learn Mode shows only cards from that subset.
- Reloading the app preserves the category/level filter; search text does not carry over.
- A zero-match filter produces a clear, actionable empty state, not a blank screen.
- Existing bucket-weighted progress tracking is unaffected — progress persists across filter changes by design.
- All 31 existing tests continue passing; new tests cover filter persistence and the Learn Mode/filter coupling.

### Acceptance Criteria
- [ ] `storage.ts` has new `readFilterState()`/`writeFilterState()` functions, round-trip tested, with defensive fallback matching `readProgress()`'s pattern.
- [ ] `AppShell` hydrates filter state from `localStorage` at construction and writes on every change.
- [ ] `LearnMode` exposes `updateFilter(newEntries)`, redrawing immediately from the updated subset.
- [ ] Learn Mode's topbar shows the active-filter chip (correct label format, hidden when default) with a working clear action.
- [ ] Zero-match filter renders the shared `EmptyState` component in Learn Mode, with mark controls hidden.
- [ ] Progress stats (mastered/shaky/new) in both views scope to the active filtered subset.
- [ ] `npm test` passes with 0 regressions plus the new test cases specified in `analysis/feature-spec.md` Section 6.

---

## Layer 2: Design Decisions

Four decision areas were converged on, all selecting the alternative most directly traceable to either an explicit constraint or an existing shipped pattern in the codebase (full alternatives and trade-off analysis in `analysis/alternatives.md`; rationale and trade-offs accepted in `analysis/design-decisions.md`):

| Area | Selected Approach |
|---|---|
| State lift-up | `AppShell` as sole owner, propagated via constructor options + `onChange` callbacks |
| Persistence schema | Flat 2-field object (`selectedCategories`, `selectedLevel`), `searchQuery` excluded at the type level |
| Active-filter indicator | Dismissible chip in Learn Mode's existing topbar |
| Empty-subset handling | Reuse Browse's existing empty-state pattern (extracted into a shared `EmptyState` component) |

## Layer 3: Mockup References

Two screens prototyped via the visual companion (both approved on first review):
- `analysis/mockups/learn-mode-active-filter-chip.html` — Learn Mode card view showing the new topbar filter chip and subset-scoped progress stats.
- `analysis/mockups/learn-mode-empty-filtered-subset.html` — Learn Mode's new empty state when the active filter matches zero entries.

---

## References

- `analysis/design-context.md` — unified synthesis of project docs, codebase analysis, and design implications
- `analysis/codebase-analysis.md` — detailed codebase analysis (state flow, dependencies, test coverage, prior design rationale)
- `analysis/problem-statement.md` — full problem statement, constraints, success criteria, and key assumptions
- `analysis/alternatives.md` — all 12 alternatives across 4 decision areas with 5-perspective trade-off matrices
- `analysis/design-decisions.md` — selected approach, rationale, and trade-offs accepted
- `analysis/feature-spec.md` — full 6-section implementation-ready specification
- `analysis/mockups/` — visual prototypes
