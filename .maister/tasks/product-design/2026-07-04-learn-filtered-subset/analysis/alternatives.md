# Solution Alternatives: Learn Mode Filtered Subset

## TL;DR
Four decision areas were explored: state-lifting approach, persistence schema, Learn Mode's active-filter indicator, and empty-subset handling. Recommended: lift `BrowseFilterState` to `AppShell` as the single source of truth with a callback-propagation model (matches existing `onChange` convention, touches all 4 components as the codebase analysis already anticipated); persist as a single flat JSON object under `skillflip:browse-filter-state` excluding `searchQuery` (mirrors `storage.ts` exactly); render the active-filter indicator as a dismissible chip row in Learn Mode's existing topbar (reuses `.progress-stats` sibling pattern, no new chrome system); and handle the empty subset by reusing Browse's existing `.empty-state` component verbatim inside Learn Mode's stage. All four recommendations are the lowest-risk, smallest-diff option in their respective alternative sets — consistent with this being a Standard-complexity wiring task, not a new subsystem.

## Key Decisions
- **State lift-up: `AppShell` as single source of truth (Alternative 1A)** — the only architecturally uncontested choice; codebase analysis, architecture doc, and design-context all independently converge on this same point.
- **Persistence schema: flat `BrowseFilterState`-shaped object, `searchQuery` omitted at write time (Alternative 2A)** — simplest schema that satisfies the "only category+level persist" constraint without a parallel type.
- **Active-filter indicator: inline dismissible chip(s) in Learn Mode's topbar (Alternative 3B)** — most discoverable within the constraint of "no navigating back to Browse," without introducing a new UI region.
- **Empty-subset handling: reuse Browse's `.empty-state` component inside Learn Mode's stage (Alternative 4A)** — zero new visual design, direct evidence link to existing `renderEmptyState()` in `BrowseGrid.ts`.

## Open Questions / Risks
- Alternative 1A requires `LearnMode.ts` to gain a way to be told "the filter changed while I'm the active view" (a `setEntries`/`updateFilter`-style method) since it currently only computes its filtered draw pool once at construction — this is a small new surface on `LearnModeInstance` not present today, flagged for the solution-designer to size precisely.
- Whether the Learn Mode filter chip should be tappable-to-clear only, or also tappable-to-jump-to-Browse-with-that-filter-preserved, is a UX-polish detail deferred to Phase 6/7 (both are compatible with the recommended approach; this file scopes the mechanism, not the exact interaction).
- The "why not" section documents specific reasons Alternatives 1B/1C, 2B/2C, 3A/3C, and 4B/4C were not selected — worth a quick operator skim before Phase 4 convergence, since some of these (e.g., 3C's persistent banner) are reasonable if the operator's taste differs from the evidence-based default.

---

## Problem Reframing

### Research Question
How should Learn Mode's card pool become scoped to Browse's active category/level filter, with that filter persisting across sessions via `localStorage`, while respecting the constraints that: only category+level persist (not search), the coupling is automatic with no confirmation step, empty-match filters must show a visible empty state rather than silently falling back, and Learn Mode must show a clearable filter indicator without requiring navigation to Browse?

### How Might We Questions
1. **HMW** lift Browse's filter state to a shared owner without breaking the existing `{element, getState, destroy}` factory contract or introducing a new state-management mechanism foreign to this codebase?
2. **HMW** persist only two of `BrowseFilterState`'s three fields to `localStorage` while keeping `storage.ts`'s existing single-object-blob convention intact?
3. **HMW** make the active filter visible and instantly clearable inside Learn Mode without duplicating Browse's `FilterBar` UI or adding a new top-level UI region?
4. **HMW** give Learn Mode a defined, non-silent behavior for a zero-match filtered subset, reusing existing empty-state patterns rather than inventing a new one?

---

## Decision Area 1: State Lift-Up — Where Shared Filter State Lives and How It Propagates

### Alternative 1A: Lift to `AppShell`, propagate via constructor options + `onChange` callbacks (Recommended)
`AppShell` becomes the sole owner of `BrowseFilterState`, reading it from `localStorage` at construction (via new `storage.ts` functions) with an in-memory fallback default. It passes the current filter state into `createBrowseGrid()`/`createFilterBar()` as an `initialState` option, and receives filter-change events back via a new `onFilterChange` callback threaded through `BrowseGrid` from `FilterBar`. On each change, `AppShell` writes to `localStorage` and calls a new `LearnMode` method (e.g. `updateFilter(subset)`) to refresh its draw pool if Learn Mode is the currently mounted-but-inactive view.

- **Strengths**: Directly matches the existing `activeTab` precedent already living in `AppShell` (design-context.md, architecture.md both flag this as "the only common ancestor" and "already has precedent for holding cross-view state"). Preserves the callback-driven, closure-based communication style used everywhere else in the codebase (`FilterBar`'s `onChange`) — no new state-management primitive introduced. Keeps `filters.ts`/`learnAlgorithm.ts` untouched, as the codebase analysis confirms both already accept subset arrays.
- **Weaknesses**: Touches 4 components' constructor options simultaneously (`AppShell`, `BrowseGrid`, `FilterBar`, `LearnMode`) rather than 1-2, which is the widest-blast-radius option among the three. `LearnMode` needs a new "update in place" method it doesn't have today (it currently computes its filtered pool once at construction time only).
- **Best when**: The codebase already has an established shared-ancestor pattern for cross-view state (it does — `activeTab`) and the team values consistency with existing conventions over minimizing the number of touched files.
- **Evidence links**: codebase-analysis.md "Recommended lift-up point: AppShell.ts"; architecture.md confirms `AppShell` as "root view-switcher" with precedent for cross-view state; design-context.md Implications-for-Design #3 explicitly calls for "a precise state-flow diagram: who owns BrowseFilterState after the lift."

### Alternative 1B: Module-level shared store (singleton outside any component)
Introduce a small new `src/lib/filterStore.ts` pure module holding `BrowseFilterState` as module-scoped state, with `getFilterState()`/`setFilterState()`/`subscribe()` functions. `BrowseGrid`, `FilterBar`, and `LearnMode` all import and read/write this store directly instead of receiving it through `AppShell`'s constructor chain.

- **Strengths**: Avoids threading the state through `AppShell`'s constructor options at all — components pull state directly, which flattens the four-file diff into more independent, potentially smaller edits per file. Testable in isolation like other `src/lib/` modules.
- **Weaknesses**: Introduces a new architectural concept (module-singleton store with subscriptions) that doesn't exist anywhere else in the codebase — every other piece of cross-component state today flows via constructor injection and callbacks, never via a shared importable singleton. This is a bigger conceptual addition than the feature warrants, and directly risks the "reviewing before commit... treating unused code as debt" and "avoiding speculative abstractions" standards (`standards/global/minimal-implementation.md`). Breaks the "pure library layer has no DOM/component awareness" boundary somewhat, since the store would need a subscription/notification mechanism resembling component state management.
- **Best when**: Three or more components need independent, uncoordinated read/write access to the same state without a natural common ancestor — not the case here, since `AppShell` already is that ancestor.
- **Evidence links**: architecture.md explicitly states "no global store" as a current architecture pattern (codebase-analysis.md, "Architecture Patterns" section); introducing one here would be the first exception to that rule for a Standard-complexity feature.

### Alternative 1C: `LearnMode` reaches into `BrowseGrid` directly (peer-to-peer reference)
`AppShell` hands `LearnMode` a direct reference to the `BrowseGridInstance` it already constructed, and `LearnMode` calls a new `browseGrid.getFilterState()` getter itself whenever it needs the current filter (e.g., on each `drawNextCard` call), rather than `AppShell` mediating.

- **Strengths**: Smallest number of new constructor options at the `AppShell` level — `AppShell` just passes one existing instance reference through, rather than owning and re-broadcasting state itself.
- **Weaknesses**: Creates a direct peer dependency between two sibling components (`LearnMode` → `BrowseGrid`) that today have zero coupling and aren't supposed to know about each other (codebase-analysis.md: "Does not import FilterBar, BrowseGrid, or filters.ts today" listed as a current-state fact, implicitly valued). This inverts the intended data flow — children reaching sideways into siblings rather than a parent mediating — and would make `BrowseGrid` a load-bearing dependency for `LearnMode`'s test setup, complicating `LearnMode.test.ts` (currently 5 self-contained scenarios per codebase-analysis.md). Also awkward for persistence: `BrowseGrid` still isn't the thing writing to `localStorage`, so this doesn't even simplify the persistence half of the problem.
- **Best when**: Two components have a natural, permanent producer/consumer relationship that justifies a direct reference — not the case here, where Browse and Learn Mode are explicitly meant to remain independent views per the original design.
- **Evidence links**: design-decisions.md/alternatives.md (2026-07-01 task) establish Browse and Learn Mode as intentionally decoupled views; codebase-analysis.md's dependency map confirms zero current imports between them in either direction — this alternative would create the first and only sideways coupling in the app.

---

## Decision Area 2: `localStorage` Persistence Schema

### Alternative 2A: Single flat object mirroring `BrowseFilterState`, `searchQuery` omitted at write time (Recommended)
New key `skillflip:browse-filter-state` stores `{ selectedCategories: Category[], selectedLevel: Level | 'All' }` — the same field names as `BrowseFilterState` minus `searchQuery`. `readFilterState()`/`writeFilterState()` mirror `readProgress()`/`writeProgress()` exactly: `JSON.parse` in a `try/catch`, safe fallback to `{ selectedCategories: [], selectedLevel: 'All' }` on missing/malformed data. At hydration time, the in-memory `BrowseFilterState` is reconstructed by merging the persisted two fields with a session-only `searchQuery: ''`.

- **Strengths**: Directly satisfies the constraint "only selectedCategories and selectedLevel persist... searchQuery does NOT persist" by construction — there's no field to accidentally round-trip. Exact structural mirror of `storage.ts`'s existing `ProgressMap` pattern (single JSON blob, one key, defensive parse, safe fallback) — the codebase analysis explicitly recommends this ("mirroring the existing progress-persistence pattern"). Smallest possible schema — two primitive-ish fields, no versioning, no nesting.
- **Weaknesses**: The persisted shape is a *subset* of the in-memory `BrowseFilterState` type, so code that hydrates state must explicitly know to inject `searchQuery: ''` rather than doing a naive spread — a small but real seam that must be documented/tested clearly (a spec-level detail, not a blocker).
- **Best when**: The persisted fields are a strict, stable subset of a larger in-memory type and the persistence layer's only job is storage, not policy — exactly this case.
- **Evidence links**: storage.ts (existing `readProgress`/`writeProgress`/`STORAGE_KEY` pattern, lines 32-57); codebase-analysis.md "proposed `FILTER_STATE_KEY = 'skillflip:browse-filter-state'`"; problem-statement.md constraint "Only category + level persist across sessions; search text is session-only."

### Alternative 2B: Persist the full `BrowseFilterState` (including `searchQuery`), but discard `searchQuery` on read
Store all three fields as-is (simplest possible write path — just `JSON.stringify(filterState)` with no field-picking), but have `readFilterState()` explicitly zero out `searchQuery` back to `''` after parsing, before returning it to callers.

- **Strengths**: The write path is trivially simple (no field-picking logic needed before serializing). Symmetric with how `FilterBar`'s full in-memory state already looks, so no separate "persisted shape" type needs to be defined at all.
- **Weaknesses**: Silently persists data to `localStorage` that the product explicitly decided should never survive a session (problem-statement.md: "search text does NOT persist... stays a one-off, in-session-only tool") — even though it's discarded on read, it sits in the user's browser storage as stale data that could leak through a future code path that reads the key directly without going through `readFilterState()`'s discard step. This is a "defense only at the read boundary" design that's more fragile than simply never writing the field — one missed call site (e.g., a future debug tool or future feature reading the raw key) reintroduces the persisted-search-text behavior the constraint rules out. Violates the spirit of "validate/enforce at the point of truth" more broadly practiced in this codebase's validation approach.
- **Best when**: The full in-memory shape must be persisted for other reasons (e.g., analytics, debugging) and discarding at read time is a deliberate, reviewed trade-off — not the case here; there's no such secondary need.
- **Evidence links**: problem-statement.md constraint explicitly rules out persisting `searchQuery`; `standards/global/validation.md` principle of enforcing rules at the authoritative point rather than downstream.

### Alternative 2C: Separate `localStorage` keys for `selectedCategories` and `selectedLevel`
Two independent keys (`skillflip:browse-filter-categories`, `skillflip:browse-filter-level`) instead of one combined object, each read/written independently.

- **Strengths**: Marginally simpler round-trip logic per field (no object wrapper, less to get wrong in a single `JSON.parse`). Each field could theoretically be cleared independently without touching the other.
- **Weaknesses**: Diverges from `storage.ts`'s existing one-key-per-concern convention, where "concern" so far has meant "one feature area" (all of Learn Mode progress in one key), not "one field." Doubles the number of `localStorage` reads/writes and new functions for no functional benefit — category and level are always read/written together in this feature's actual usage (they're both part of the same `onChange` event from `FilterBar`), so splitting them adds surface area without adding capability. Directly conflicts with `standards/global/coding-style.md`'s DRY principle and `minimal-implementation.md`'s "build only what you need."
- **Best when**: Two pieces of state genuinely have independent lifecycles or update cadences — not the case here, since category and level always change together as part of one `BrowseFilterState` object emitted by one `onChange` callback.
- **Evidence links**: storage.ts's existing single-key-per-feature convention (one `STORAGE_KEY` for all of progress, not one per bucket type); codebase-analysis.md's single proposed key (`skillflip:browse-filter-state`) as the natural mirror.

---

## Decision Area 3: Active-Filter Indicator + Quick-Clear in Learn Mode

### Alternative 3B: Inline dismissible filter chip(s) in Learn Mode's existing topbar (Recommended)
Add a small chip/pill region to `LearnMode`'s topbar (between or near the existing `.progress-stats` element) that renders only when a filter is active — e.g. `Java · Senior ✕` — with a click target on the `✕` that clears the filter (writes the cleared state via the same `AppShell`-mediated path as Decision Area 1) and immediately triggers a redraw from the full glossary.

- **Strengths**: Reuses the topbar region that already exists in `LearnMode.ts` (`topbar.append(exitBtn, progressStats, resetBtn)`) — no new top-level UI region, no layout restructuring. Satisfies the constraint "visible indicator... quick way to clear it without navigating back to Browse" directly and minimally. Consistent with the existing icon-button affordance pattern already used for exit/reset (`.icon-btn` elements), so the new control matches established visual/interaction conventions rather than inventing a new one.
- **Weaknesses**: Topbar is already fairly dense (exit icon, progress stats, reset icon) — an additional chip needs careful spacing/responsive handling, especially on the mobile-first layout this app targets (`standards/frontend/responsive.md`). If multiple categories are selected, the chip must handle overflow/truncation (a smaller-scoped version of the same "+N more" problem `FilterBar` already solves for its own chip row) — solvable but adds a little scope to the visual design phase.
- **Best when**: The indicator needs to be persistently visible during the primary task (studying cards) without interrupting it, and an existing chrome region can accommodate it — true here.
- **Evidence links**: LearnMode.ts topbar structure (lines 52-71, existing `.icon-btn` pattern for exit/reset); problem-statement.md constraint "Learn Mode shows a visible indicator of the active filter, with a quick clear action available without returning to Browse"; FilterBar.ts's own "+N more" overflow-chip precedent for handling multi-select display compactly.

### Alternative 3A: Passive text-only indicator, clear via existing reset-progress-style icon reuse
A plain text label (no chip styling, no individual dismiss target) e.g. "Filtered: Java, Senior" appears in the topbar, and clearing the filter is done via a single new icon button (separate from the existing reset-progress `↻` button) that clears the whole filter in one tap — no per-category removal, just an all-or-nothing clear.

- **Strengths**: Simplest possible implementation — one text node, one button, no chip-list rendering/wrapping logic at all. Fastest to build and least likely to have a visual edge case (no overflow, no truncation).
- **Weaknesses**: All-or-nothing clear is a weaker interaction than the per-category chip model Browse's own `FilterBar` already establishes (users can't tell at a glance which part of a compound filter — e.g., category vs. level — they might want to drop first, they must clear everything and re-filter in Browse for a partial adjustment). A plain text label is a smaller visual departure from "no indicator" than a chip, which risks under-delivering on the "visible indicator" constraint — passive text competing with a card's content for attention is easy to miss during a fast-paced study session (the Creator persona's actual usage pattern, per personas.md).
- **Best when**: The team wants to ship the smallest possible diff and is comfortable with an all-or-nothing clear interaction, e.g., if user testing later shows compound filters (category + level together) are rare in practice.
- **Evidence links**: personas.md's Creator usage pattern ("short bursts... 5-10 minute sessions... mostly on mobile") argues for glanceable, low-friction UI, which a passive text label satisfies less well than a chip; FilterBar.ts's existing chip-based interaction model as the app's established convention for multi-value filter display.

### Alternative 3C: Persistent banner/bar above the card stage (separate from topbar)
A full-width banner element sits between Learn Mode's topbar and the card stage, only rendered when a filter is active, showing the filter description and a "Clear filter" text link/button — visually distinct from the topbar rather than integrated into it.

- **Strengths**: Doesn't compete for space inside the already-populated topbar; can accommodate more descriptive text (e.g., "Studying: Java, Senior level (12 cards)") without truncation concerns, since it has its own dedicated horizontal band.
- **Weaknesses**: Introduces a new UI region/pattern to `LearnMode.ts` that doesn't exist anywhere else in the app today — every other piece of chrome lives in the topbar or the card stage itself, so a third horizontal band is a bigger structural/visual change for a Standard-complexity feature. Permanently reduces vertical space available for the card itself on small mobile viewports, which directly works against the mobile-first, short-session usage pattern this app is built around (`standards/frontend/responsive.md`, personas.md). Larger surface area to design/test than a topbar chip for materially the same information.
- **Best when**: The filter-context information is rich enough (e.g., multiple independent facets, live counts, additional actions) that it outgrows a compact chip — not the case here, since the persisted state is just two simple fields (category list + level).
- **Evidence links**: architecture.md's description of `LearnMode` as owning "its own topbar (exit-to-browse icon + progress-stats + reset-progress icon)" with no precedent for a secondary chrome band; roadmap.md's "fix small UX issues as they surface" framing arguing against introducing new structural UI regions for what is fundamentally a small addition.

---

## Decision Area 4: Empty-Subset Handling in Learn Mode

### Alternative 4A: Reuse Browse's existing `.empty-state` component verbatim inside Learn Mode's stage (Recommended)
When the filtered subset passed to `drawNextCard` would be empty, `LearnMode` renders the same empty-state pattern already implemented in `BrowseGrid.ts`'s `renderEmptyState()` (icon + heading + helper text + a "Clear filters" button) inside its `learnStage` container in place of the `Card`, adapting only the copy (e.g., "No cards match your filter" / "Try clearing a filter to keep studying.") and wiring the clear button to the same filter-clear path used by the topbar chip's dismiss action (Decision Area 3).

- **Strengths**: Directly satisfies the constraint "zero-match filter combinations must show a visible empty state with a broaden/clear action" using a pattern the app — and its users — already know from Browse, so there's no new visual language to design or learn. `BrowseGrid.ts`'s `renderEmptyState()` (lines 64-88) is a small, self-contained function that can be extracted/shared or duplicated with minimal risk either way. Directly reuses the "never silently fall back to the full glossary" behavior Browse already exhibits (it shows an empty grid, not a silently-widened one).
- **Weaknesses**: Requires a small decision on code-reuse mechanics — extract `renderEmptyState()` into a shared helper (e.g., in a new small `src/components/EmptyState.ts` or kept in `BrowseGrid.ts` and imported) versus duplicating the ~25 lines into `LearnMode.ts` with different copy. This is a minor implementation-planning detail, not a design-level trade-off, but should be flagged for the solution-designer/spec so it isn't left ambiguous. `LearnMode`'s current one-time-at-construction draw model (`drawNextCard` called once in the initializer, line 49) needs to become re-checkable whenever the filter changes, not just at mount — same underlying change already required by Decision Area 1's `updateFilter` method.
- **Best when**: An established empty-state pattern already exists elsewhere in the app for the same underlying condition (zero matching entries) — exactly the case here, since Browse already solved this exact problem for its own grid.
- **Evidence links**: BrowseGrid.ts `renderEmptyState()` (lines 64-88) and its wiring to `filterBar.reset()`; problem-statement.md constraint "Zero-match filter combinations show a visible empty state with a broaden/clear action (consistent with Browse's existing pattern)" — the constraint itself explicitly calls for consistency with the existing pattern, making this the most evidence-aligned option by construction.

### Alternative 4B: Disable/hide the Learn tab entirely when the active filter has zero matches
`AppShell` checks whether `applyFilters(entries, filterState)` is empty whenever the filter changes; if so, it disables the Learn tab button (grayed out, non-clickable) until the filter is broadened or cleared, keeping the user in Browse where the empty state (and the means to fix it) is already visible.

- **Strengths**: Prevents the user from ever seeing an empty Learn Mode at all — arguably the simplest way to guarantee "never a confusing blank screen" since the screen is never reached in the first place.
- **Weaknesses**: Directly violates the explicit constraint "never blocks the filter combination from being set" in spirit, if not letter — while the constraint is about not blocking the *filter* from being applied in Browse, disabling the *tab* still blocks the user's ability to enter Learn Mode at all in this state, which the problem statement's success criteria implies should instead surface "a clear, actionable empty state in Learn Mode" (i.e., Learn Mode should still be enterable and show something, not become unreachable). Also inconsistent with Learn Mode's designed-in "always-resumable... no start-session gate" philosophy (LearnMode.ts's own header comment) — a disabled tab is itself a new kind of gate. Worse for the Creator persona's actual failure-recovery path: if they land in Learn Mode already active with a filter that was set in a prior session and has since become zero-match (e.g., content was removed), a disabled tab with no explanation is more confusing than an in-place empty state with a clear action.
- **Best when**: A view genuinely cannot render anything meaningful in a given state and a disabled affordance is clearer than letting the user enter and immediately bounce — not the case here, since Learn Mode has a well-defined, reusable empty-state pattern available (Alternative 4A) that can render something actionable.
- **Evidence links**: problem-statement.md success criteria "A zero-match filter combination produces a clear, actionable empty state **in Learn Mode**" (explicitly locating the empty state inside Learn Mode, not preventing entry to it); LearnMode.ts header comment "Always-resumable: a weighted-drawn card is shown as soon as this component mounts, with no 'start session' gate" as an existing design principle this alternative would contradict.

### Alternative 4C: Silently widen the draw pool by dropping the level filter (partial fallback)
If category + level together produce zero matches, automatically drop just the level constraint (keep category) and draw from that broader pool instead, without asking or clearly signaling that a fallback occurred.

- **Strengths**: Guarantees Learn Mode almost always has cards to show (only a category with truly zero entries at any level would still be empty), minimizing the frequency users hit an empty state at all.
- **Weaknesses**: Directly and explicitly violates the stated constraint "never silently fall back to the full glossary" — while this is a *partial* fallback rather than a full one, it's the same category of behavior the constraint rules out (silently showing cards the user didn't ask for, under a filter label that no longer accurately describes what's being shown). Creates a trust/mental-model problem: the topbar filter indicator (Decision Area 3) would say "Java, Senior" while actually drawing from "Java, all levels," a mismatch between displayed state and actual behavior that is worse than an honest empty state. Adds meaningful new logic to what both the problem statement and codebase analysis characterize as "wiring, not algorithms" — this alternative reintroduces algorithmic decision-making (which constraint to relax, in what order) that the constraints were written specifically to avoid.
- **Best when**: The product goal is to maximize engagement/card-shown-frequency above filter fidelity, and users have explicitly opted into "loose" filtering — not the case here; the requester explicitly asked for exact, automatic, always-in-sync coupling between Browse's filter and Learn Mode's pool.
- **Evidence links**: problem-statement.md constraint, verbatim: "never silently falls back to the full glossary, and never blocks the filter combination from being set" (the word "silently" is doing direct evidentiary work against this alternative); constraints.md's "automatic, always-in-sync coupling" requirement, which this alternative would break the instant a fallback silently occurred.

---

## Trade-Off Analysis

### Decision Area 1: State Lift-Up

| Alternative | Technical Feasibility | User Impact | Simplicity | Risk | Scalability |
|---|---|---|---|---|---|
| **1A. Lift to AppShell + callbacks (Recommended)** | High — matches existing patterns exactly, no new primitives | Neutral (invisible plumbing) | Medium — touches 4 files but each change is small and idiomatic | Low — follows established conventions, easy to test incrementally | High — same model scales to future cross-view state needs |
| 1B. Module-level shared store | Medium — feasible but net-new pattern to design well | Neutral | Low — new concept (subscriptions) adds cognitive load | Medium — first-of-its-kind pattern, more ways to get subtly wrong | Medium — could scale further but the app has no other candidate for it yet |
| 1C. Peer-to-peer LearnMode→BrowseGrid reference | Medium — technically simple wiring, but fights existing decoupling | Neutral | Medium — simple in isolation but breaks the "no sideways deps" mental model | Medium-High — couples two components meant to stay independent, complicates future changes to either | Low — doesn't generalize; still doesn't solve persistence |

### Decision Area 2: Persistence Schema

| Alternative | Technical Feasibility | User Impact | Simplicity | Risk | Scalability |
|---|---|---|---|---|---|
| **2A. Flat 2-field object, search omitted at write (Recommended)** | High — near-mechanical mirror of `storage.ts` | Neutral (matches stated constraint exactly) | High — smallest schema that satisfies requirements | Low — constraint enforced structurally, not by convention | High — trivial to extend if more filter fields are added later |
| 2B. Persist all 3 fields, discard search on read | High — equally easy to implement | Neutral on the surface, but risks stale-data confusion if inspected | Medium — simple write, but read-time special-casing is an extra rule to remember | Medium — enforcement lives at the wrong layer (read, not write) | Medium — every future consumer of the raw key must remember the discard rule |
| 2C. Separate keys per field | High — easy but unnecessary | Neutral | Low — doubles the functions/keys for no behavioral gain | Low-Medium — more surface area, more chances for the two keys to fall out of sync | Low — doesn't match how the fields are actually produced/consumed (always together) |

### Decision Area 3: Active-Filter Indicator

| Alternative | Technical Feasibility | User Impact | Simplicity | Risk | Scalability |
|---|---|---|---|---|---|
| 3A. Passive text + single clear-all icon | High — least code | Medium — glanceable but weaker at a fast-paced glance; no partial clear | High | Low | Medium — doesn't extend well if finer-grained clearing is wanted later |
| **3B. Inline dismissible chip(s) in topbar (Recommended)** | Medium-High — reuses existing icon-button/chip conventions, some new layout work | High — clear, familiar, matches Browse's own chip language | Medium — some overflow/responsive handling needed | Low-Medium — mobile topbar density needs care but pattern is proven elsewhere | High — naturally extends to more filter fields if added later |
| 3C. Persistent banner above card stage | Medium — new UI region, more design/test surface | Medium — very visible, but costs permanent vertical space on mobile | Low — new structural pattern | Medium — first-of-its-kind chrome region, larger surface for regressions | Low-Medium — doesn't reuse anything existing; own maintenance burden |

### Decision Area 4: Empty-Subset Handling

| Alternative | Technical Feasibility | User Impact | Simplicity | Risk | Scalability |
|---|---|---|---|---|---|
| **4A. Reuse Browse's `.empty-state` inside Learn Mode (Recommended)** | High — pattern and copy structure already exist | High — familiar, actionable, consistent with Browse | Medium — needs a small reuse/duplication decision, otherwise simple | Low — reuses a already-shipped, tested pattern | High — same pattern covers any future zero-match scenario |
| 4B. Disable Learn tab on zero-match | High — simple conditional on tab button | Low — blocks entry, contradicts "always-resumable" design principle, confusing on stale filters | High (to build) | Medium-High — contradicts explicit constraint language and existing design principle | Low — doesn't generalize to "show something useful," only to "prevent access" |
| 4C. Silent partial fallback (drop level) | Medium — requires new decision logic on what to relax | Low — breaks trust between displayed filter and actual pool; explicitly against stated constraint | Low — reintroduces algorithmic complexity constraints were meant to avoid | High — directly violates a written constraint ("never silently fall back") | Low — every new filter dimension needs its own fallback-order decision |

---

## User Preferences

No live user-dialogue preferences were supplied to this phase (Phase 3 skipped interactive preference-gathering per the accumulated context — "Phase 3 skipped this round since not greenfield/complex"). All four recommendations above are therefore derived purely from:
- The explicit, already-confirmed constraints in `problem-statement.md` (persistence mechanism, persisted-field scope, automatic coupling, empty-state behavior, filter visibility).
- Architectural precedent already established in the codebase (component-factory pattern, `src/components/` vs `src/lib/` split, `storage.ts`'s persistence convention, `BrowseGrid.ts`'s existing empty-state).
- The Creator persona's usage pattern (short, frequent, mobile-first sessions) as the only persona materially affected by this feature, per `problem-statement.md`'s Key Assumptions.

Where a constraint was explicit and unambiguous (e.g., "only category+level persist"), the alternatives were evaluated primarily on fidelity to that constraint (Decision Area 2). Where the constraint left room for genuine design choice (e.g., exact visual form of the indicator), alternatives were evaluated on the 5-perspective balance described above.

---

## Recommended Approach

**Combination**: Alternative 1A (AppShell-owned state + callback propagation) + Alternative 2A (flat 2-field persisted schema) + Alternative 3B (inline dismissible topbar chip) + Alternative 4A (reused `.empty-state` pattern).

**Primary rationale**: Every recommended alternative is simultaneously (a) the smallest structural change in its decision area, (b) the option most directly traceable to explicit evidence (either a written constraint or an existing, already-shipped pattern in the codebase), and (c) consistent with the "Standard complexity, wiring not algorithms" framing established by the codebase analysis. None of the four introduces a new architectural concept to the app (no global store, no new UI chrome region, no new fallback-decision logic) — they compose entirely from patterns the codebase already has (constructor-injected state + callbacks, single-key JSON persistence, icon-button/chip UI, empty-state-with-clear-action).

**Key trade-offs accepted**:
- Touching 4 components (Decision Area 1) is a wider diff than the alternatives that touch fewer files, but it's the option most consistent with existing conventions and lowest execution risk — a deliberate trade of diff size for pattern consistency and testability.
- The topbar chip (Decision Area 3) requires some new responsive/overflow handling that a plain text label wouldn't, but is significantly more discoverable and consistent with Browse's own chip-based filter language — a deliberate trade of a little extra design/build effort for stronger usability alignment with the "visible indicator" constraint.

**Key assumptions** (if wrong, would change the recommendation):
- `LearnMode` can be extended with a small "update filter/entries in place" capability without a deep rewrite of its current construction-time-only draw logic — if this turns out to require substantial restructuring, Alternative 1C (peer reference, avoiding the need for AppShell to "push" updates into a live LearnMode) might become comparatively more attractive despite its coupling downsides.
- The topbar has enough available horizontal space on the smallest supported mobile viewport to add a chip without redesigning the whole topbar — if visual prototyping (Phase 7) shows this doesn't fit, Alternative 3C (separate banner) should be reconsidered despite its larger structural footprint.
- Extracting or duplicating `renderEmptyState()` is genuinely low-risk either way — if the eventual spec/implementation phase finds meaningful divergence needed between Browse's and Learn Mode's empty-state copy/behavior beyond what a shared component can parameterize cleanly, a Learn-Mode-specific variant (still visually consistent, just not literally shared code) remains compatible with this same recommendation.

**Confidence**: High. All four recommended alternatives are directly supported by either an explicit written constraint or an existing, already-tested pattern in the shipped codebase — this is not a case of choosing between comparably-weighted trade-offs so much as identifying the option in each decision area that best honors evidence already gathered in Phases 1-2.

---

## Why Not Others

- **1B (module-level shared store)**: Introduces the app's first global-store pattern for a single, well-contained use case that an existing shared-ancestor component (`AppShell`) already handles adequately — unnecessary new architectural surface for a Standard-complexity feature.
- **1C (peer-to-peer reference)**: Creates the app's first sideways component coupling, contradicting the original design's intentional Browse/Learn-Mode decoupling, and doesn't actually simplify the persistence half of the problem (persistence still needs a home, which would have to be `AppShell` or `BrowseGrid` regardless).
- **2B (persist all fields, discard on read)**: Enforces the "no search persistence" rule at the read boundary instead of the write boundary, leaving stale search text sitting in `localStorage` and creating a latent risk for any future code path that reads the raw key directly.
- **2C (separate keys per field)**: Adds persistence surface area (two keys, two read/write pairs) with no corresponding capability gain, since category and level are always produced and consumed together as one `onChange` event.
- **3A (passive text + clear-all)**: Weakest at-a-glance visibility for the Creator's fast, mobile-first sessions, and the all-or-nothing clear is a step down from the per-category granularity Browse's own `FilterBar` already offers.
- **3C (persistent banner)**: Introduces a new structural chrome region unprecedented elsewhere in the app, permanently costing mobile vertical space, for information that fits comfortably in a compact chip.
- **4B (disable Learn tab)**: Contradicts both the explicit "never blocks... never a confusing blank screen" intent of the constraints and Learn Mode's own documented "always-resumable, no start-session gate" design principle.
- **4C (silent partial fallback)**: Directly violates the literal, explicit constraint "never silently fall back," and reintroduces algorithmic fallback-ordering logic the rest of this feature deliberately avoids.

---

## Deferred Ideas

- **Cross-device filter sync**: Explicitly ruled out of scope by `problem-statement.md`'s Key Assumptions ("'Remembering the filter' means surviving a page reload / new browser session, not cross-device sync"). Consistent with the existing no-sync `localStorage` approach for progress; not reconsidered here.
- **Per-filter-subset progress views** (e.g., "% mastered within the current filter" rather than only global stats): Surfaced as a natural extension once Learn Mode is filter-aware, but is a new feature beyond "Learn Mode draws from the filtered subset" — the current `progressStats` component computes global bucket counts only, and changing that is outside this task's scope per the codebase analysis's explicit note that `progressStats` is "unaffected by this feature."
- **Tapping the Learn Mode filter chip to jump directly into Browse with that filter pre-applied** (rather than only clearing it): A plausible nice-to-have raised while evaluating Decision Area 3, but goes beyond the stated constraint ("quick way to clear it") into new navigation behavior — worth noting for a future small enhancement, not incorporated into any alternative here.
- **Saved/named filter presets** (e.g., "my Java study set," "Senior review"): An adjacent idea that emerged naturally from persisting one filter, but is a materially larger feature (multiple saved states, a management UI) than the single always-current filter this task specifies — explicitly out of scope.

