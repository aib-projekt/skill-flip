# Design Decisions

## TL;DR
Selected the fully evidence-aligned combination across all 4 decision areas: `AppShell` becomes the sole owner of `BrowseFilterState` with callback propagation (1A); persistence is a flat 2-field `localStorage` object mirroring `storage.ts`'s existing convention, with `searchQuery` excluded structurally rather than filtered on read (2A); the active filter is shown as a dismissible chip in Learn Mode's existing topbar (3B); and a zero-match subset reuses Browse's existing empty-state pattern verbatim inside Learn Mode (4A). No new architectural concepts are introduced anywhere in this design.

## Key Decisions
- **State lift-up: `AppShell` as sole owner (1A)** — matches the existing `activeTab` precedent, keeps `filters.ts`/`learnAlgorithm.ts` untouched, and is the only option that doesn't introduce a new architectural concept or break the intentional Browse/Learn-Mode boundary.
- **Persistence schema: flat 2-field object, search omitted at write (2A)** — mirrors `storage.ts`'s `readProgress`/`writeProgress` pattern exactly; enforces "no search persistence" structurally rather than by convention.
- **Active-filter indicator: dismissible chip in Learn Mode's topbar (3B)** — reuses existing chrome, matches the existing icon-button/chip visual language already used elsewhere in the app.
- **Empty-subset handling: reuse Browse's `.empty-state` pattern (4A)** — zero new visual design, consistent with the constraint's own wording ("consistent with Browse's existing pattern").

## Open Questions / Risks
- `LearnMode.ts` currently computes its draw pool only once at construction; both 1A and 4A require it to gain a new "update in place" capability — this is a real (if small) new surface on `LearnModeInstance`, to be sized precisely in Phase 6.
- Whether the topbar chip should also support "tap to jump to Browse with this filter preserved" (beyond just clearing) is deferred as a UX-polish detail to Phase 6/7 — both are compatible with this direction.
- Reuse mechanics for the empty-state pattern (extract to a shared component vs. duplicate with different copy) is an implementation-planning detail, not a design trade-off — to be resolved in Phase 6.

---

## Selected Approach

The feature is implemented as a **state lift-up + persistence wiring** change, with zero modifications to the existing pure-logic layer (`applyFilters`, `drawNextCard`). `AppShell` becomes the single source of truth for `BrowseFilterState`:

1. **On construction**, `AppShell` reads the persisted filter (category + level only) from a new `localStorage` key via `storage.ts`'s new `readFilterState()`, falling back to `{ selectedCategories: [], selectedLevel: 'All' }` on missing/malformed data — identical defensive pattern to `readProgress()`.
2. `AppShell` passes the current filter state into `createBrowseGrid()`/`createFilterBar()` as an initial-state option, and into `createLearnMode()` as the subset to draw from.
3. **On any filter change** (via `FilterBar`'s existing `onChange` callback, propagated up through `BrowseGrid`), `AppShell` writes the updated category/level to `localStorage` via `writeFilterState()` and calls a new method on the `LearnMode` instance to update its live draw pool if Learn Mode is mounted.
4. **Learn Mode's UI** gains a dismissible chip (e.g. "Java · Senior ✕") in its existing topbar, next to `.progress-stats`, visible only when a filter is active. Tapping it clears the filter through the same `AppShell`-mediated path.
5. **If the active filter matches zero entries**, Learn Mode renders the same empty-state pattern already used in `BrowseGrid.ts` (icon + heading + helper text + "Clear filters" button) in place of the card, with adapted copy.

## Trade-Offs Accepted

- **Wider diff for Decision Area 1**: touching 4 components' constructor options (vs. 1-2 in the rejected alternatives) is a deliberate trade of diff size for consistency with existing conventions and lower long-term risk.
- **New responsive/overflow handling for the topbar chip (Decision Area 3)**: a plain text label would have been simpler to build, but the chip is significantly more discoverable and consistent with Browse's own filter-chip language — worth the small extra design/build effort.
- **A small new capability on `LearnMode`**: both 1A and 4A require `LearnMode` to react to filter changes after construction (not just at mount), which is new surface area but was flagged and accepted as necessary rather than worked around.

## Key Decisions Per Area

(Full alternative detail and trade-off matrices in `analysis/alternatives.md`.)

| Area | Selected | Rejected & why |
|---|---|---|
| 1. State lift-up | 1A: AppShell + callbacks | 1B (module-level store) — introduces the app's first global-store pattern for a single well-contained use case. 1C (peer-to-peer reference) — creates the app's first sideways coupling and doesn't even solve persistence. |
| 2. Persistence schema | 2A: Flat 2-field object, search omitted at write | 2B (persist all, discard on read) — enforces the rule at the wrong layer, leaving stale search text in storage. 2C (separate keys) — more surface area for no capability gain. |
| 3. Filter indicator | 3B: Dismissible topbar chip | 3A (passive text) — weaker at-a-glance visibility, all-or-nothing clear. 3C (persistent banner) — new UI region, permanently costs mobile vertical space. |
| 4. Empty-subset handling | 4A: Reuse Browse's empty-state | 4B (disable Learn tab) — contradicts "always-resumable" design principle and the constraint's intent. 4C (silent partial fallback) — directly violates "never silently fall back." |

## Key Assumptions

- `LearnMode` can be extended with a small "update filter/entries in place" capability without a deep rewrite of its current construction-time-only draw logic. If this turns out to require substantial restructuring, 1C would become comparatively more attractive despite its coupling downsides.
- The topbar has enough horizontal space on the smallest supported mobile viewport to add a chip without redesigning the whole topbar. If Phase 7 visual prototyping shows this doesn't fit, 3C should be reconsidered.
- Extracting or duplicating `renderEmptyState()` is low-risk either way; if meaningful divergence is later needed between Browse's and Learn Mode's empty-state behavior, a Learn-Mode-specific variant remains compatible with this same direction.

**Confidence**: High — every selected alternative is the smallest structural change in its area, directly traceable to either an explicit written constraint or an existing shipped pattern in the codebase, and introduces no new architectural concepts.
