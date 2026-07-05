# Design Context

## TL;DR
Skill Flip's Learn Mode and Browse are intentionally decoupled today — Browse's filter state is component-local, never persisted, and Learn Mode always draws from the full 159-entry glossary. The requested feature (Learn Mode uses Browse's filtered subset; that filter persists locally across sessions) is a straightforward wiring change at the pure-logic layer (`applyFilters`/`drawNextCard` already accept subsets) but **reverses an explicit prior design decision** recorded in the original feature spec, which ruled out filter persistence and deliberately kept the two views separate for a stated UX reason (Browse is exploratory/low-stakes; Learn Mode is focused review).

## Key Decisions
- None yet — this document synthesizes context ahead of Phase 2 problem exploration; no design decisions have been made.

## Open Questions / Risks
- **Reverses a documented decision**: `feature-spec.md` (Section 3) explicitly states filter persistence was ruled out as "unrequested scope," and `alternatives.md`/`design-decisions.md` explain the Browse/Learn Mode split as intentional (two distinct personas' journeys: exploratory browsing vs. focused review). This should be surfaced and consciously re-confirmed with the requester, not silently overridden.
- **Empty-subset edge case undefined**: what happens if the active filter matches zero entries and the user opens Learn Mode? Needs a design decision (Phase 2/6).
- **Mental model risk**: Learn Mode progress is keyed by entry `id`, not by filter — so progress for a card learned under one filter persists even after switching filters. This is likely correct behavior but should be an explicit, confirmed decision rather than an implicit side effect.

---

## Project Documentation Summary

(Read directly from `.maister/docs/project/` — generated during `/maister:init` earlier this session.)

- **Vision** (`vision.md`): Skill Flip is a personal study tool + recruiter-facing portfolio piece, dual priority. Current direction favors staying a personal study tool with small UX fixes over major feature pushes — this request fits that mold (a UX refinement, not a pivot).
- **Roadmap** (`roadmap.md`): Explicitly lists "fix small UX issues as they surface" as a high-priority ongoing activity; this request is consistent with that stated direction.
- **Tech Stack** (`tech-stack.md`): Vite + vanilla TypeScript (strict), zero runtime dependencies, no framework — component-factory pattern. Any new code must stay dependency-free and match the existing factory-function style.
- **Architecture** (`architecture.md`): Confirms the intentional `src/components/` (stateful, DOM-owning) vs. `src/lib/` (pure, testable) split, and that `AppShell` is the root view-switcher with no shared topbar. This matches the codebase analysis's recommendation to lift filter state to `AppShell`.

## Codebase Analysis Summary

(Full detail in `analysis/codebase-analysis.md` — 2 Explore agents: Code Analysis, Context Discovery.)

- **Current state**: Browse's `BrowseFilterState` (search/category/level) lives entirely inside `BrowseGrid.ts` as component-local state, populated via `FilterBar`'s `onChange` callback. It is never persisted and never exposed outside `BrowseGrid`. Learn Mode (`LearnMode.ts`) calls `drawNextCard(entries, readProgress(), previousId)` with the full, unfiltered glossary array — there is zero coupling between the two views today.
- **Why the pure-logic layer needs no changes**: `applyFilters(entries, state): Glossary` and `drawNextCard(entries, progress, previousId): GlossaryEntry` both already accept any array — including a pre-filtered subset — as their `entries` parameter. The work is entirely about *which* array gets passed in, not changing these functions.
- **Recommended lift-up point**: `AppShell.ts` — it already owns both `LearnMode` and `BrowseGrid` instances and has precedent for holding cross-view state (though today only `activeTab`). Lifting `BrowseFilterState` here lets both views read the same filter.
- **Persistence precedent to follow**: `storage.ts`'s existing convention — a single `localStorage` key (`skillflip:learn-progress`) holding JSON, read/written via small dedicated functions (`readProgress`/`writeProgress`), with defensive `try/catch` around `JSON.parse` and a safe empty-object fallback. A new filter-state key should mirror this exactly (e.g. `skillflip:browse-filter-state`).
- **Coding patterns any new code must match**: factory functions returning `{ element, getState, destroy, ... }`; pure library functions with no DOM access; callback-driven parent/child communication (`onChange`); defensive shallow-copies on every `getState()`; no classes.
- **Test coverage**: 31 existing tests across 5 files (`BrowseGrid.test.ts`, `LearnMode.test.ts`, `learnAlgorithm.test.ts`, `storage.test.ts`, `filters.test.ts`) — none cover filter persistence or Learn Mode/filter coupling. This is net-new test-writing, not extension of existing cases.
- **Complexity**: Moderate. **Risk**: Medium — not from algorithmic difficulty (none), but because it touches 4 components' state ownership simultaneously and reverses a previously-reasoned-through product decision.

## Cross-Reference Insights

- The tech-stack/architecture docs' emphasis on strict separation (`components/` vs `lib/`) directly matches the codebase analysis's finding that the fix is "wiring, not algorithms" — the existing architecture was already built in a way that makes this feature additive rather than invasive.
- The roadmap's "fix small UX issues as they surface" framing and this request's small, self-contained scope both point toward **Standard** complexity (confirmed in Phase 0) rather than treating this as a bigger initiative.
- The prior design decision to keep Browse and Learn Mode decoupled (from `alternatives.md`/`design-decisions.md`, dated 2026-07-01) was reasoned from persona journeys ("Creator flips through cards in Learn Mode" vs. "occasionally browses/filters outside Learn Mode" as *distinct* intents). The new request assumes these intents should now converge for at least the filtering dimension — this tension is the central question for Phase 2.

## Implications for Design

1. **Phase 2 must explicitly address the reversed decision** — not as a blocker, but as a confirmed, deliberate choice (e.g., "the Creator persona's usage pattern has evolved" or "the original rationale was about persistence broadly, not this specific coupling").
2. **Persistence design should mirror `storage.ts`'s existing convention** exactly — same defensive-parse pattern, same key-naming style, sibling function names (`readFilterState`/`writeFilterState`).
3. **State-ownership change is the crux of the spec** — Phase 6 (Feature Specification) needs a precise state-flow diagram: who owns `BrowseFilterState` after the lift, how `onChange` propagates, and what triggers a redraw in Learn Mode when the filter changes while Learn Mode is inactive vs. active.
4. **Empty-subset UX needs a specified answer** — not deferrable to implementation, since it's a real user-facing edge case (e.g., filter to "Mentoring" + "Junior" = 0 entries) that determines whether Learn Mode shows an empty state, a fallback, or blocks entry from Browse.
