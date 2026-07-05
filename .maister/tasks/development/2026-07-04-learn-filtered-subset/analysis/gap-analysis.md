# Gap Analysis: Learn Mode Respects Browse's Filtered Subset

## TL;DR
This task arrives with a fully approved, implementation-ready `feature-spec.md` (6 sections) and a codebase-analysis that already cross-checked the spec against live code with zero drift found. Gap analysis confirms: the gap is exactly as described (Learn Mode is 100% decoupled from Browse's filter today, no persistence exists), the change is purely additive across 5 files + 1 new file, and no orphaned operations or missing touchpoints exist — every new capability (persistence, propagation, chip UI, empty state) is wired end-to-end to a user-visible surface in the spec. No critical decisions remain open. One minor implementation-note (not a decision) is flagged: `LearnMode.ts`'s `entries` binding is a destructured `const`, so `updateFilter()` will need a mutable local variable, slightly more than the spec's "replaces the internal reference" phrasing implies.

## Key Decisions
- Treated `feature-spec.md` as authoritative for all type shapes, storage keys, and wiring, per already-resolved clarification Q1 — this analysis does not re-derive requirements, only verifies absence of drift and completeness of coverage.
- Classified as `modifies_existing_code` (not `creates_new_entities`) for characteristic purposes, despite one new file (`EmptyState.ts`), because the new file is an extraction of already-existing, already-tested logic (`BrowseGrid.renderEmptyState()`), not a novel capability — this shapes the module selection below (Existing Feature Analysis + Data Lifecycle, not New Capability Analysis as primary).

## Open Questions / Risks
- `LearnMode.ts` line 45 (`const { entries } = options`) is a destructured constant — implementing `updateFilter(newEntries)` per spec Section 2 ("replaces the internal `entries` reference") requires introducing a mutable local (e.g. `let currentEntries = entries`) and updating all downstream references (lines 49, 136, plus the new stats/chip call sites). This is an implementation detail any competent implementer resolves without a decision, but flagging it so the planner scopes it explicitly rather than treating it as a one-line change.
- `FilterBar.ts` gains a new option (`initialState`) with no new dedicated test file — already flagged as an accepted gap in both `codebase-analysis.md` and the feature-spec itself (Section 6 explicitly omits `FilterBar.test.ts`). Not re-flagging as a decision since the spec is explicit and this was implicitly accepted when the spec was approved; noted here only for completeness of the audit trail.

## Summary
- **Risk Level**: Low-Medium
- **Estimated Effort**: Medium
- **Detected Characteristics**: `modifies_existing_code`, `involves_data_operations`, `ui_heavy`

## Task Characteristics
- Has reproducible defect: no
- Modifies existing code: yes — 5 existing files gain new optional fields/methods (`AppShell.ts`, `BrowseGrid.ts`, `FilterBar.ts`, `LearnMode.ts`, `storage.ts`); `BrowseGrid.ts` additionally undergoes an approved internal refactor (empty-state extraction)
- Creates new entities: marginal — one new file (`EmptyState.ts`), but it is an extraction of existing logic, not novel capability; treated as secondary characteristic
- Involves data operations: yes — new localStorage persistence (`readFilterState`/`writeFilterState`) is a CRUD-shaped concern (create/read/update of persisted filter state)
- UI heavy: yes — new topbar chip in Learn Mode, empty-state UI reused in a new context, new CSS class

## Gaps Identified

### Missing Features
- **Filter-state persistence**: No `readFilterState`/`writeFilterState`/`FILTER_STATE_KEY`/`PersistedFilterState` exist anywhere in `src/lib/storage.ts` (verified: only `STORAGE_KEY = 'skillflip:learn-progress'` and progress functions exist, lines 1-88). Gap matches spec Section 1 exactly.
- **Learn Mode ↔ Browse filter coupling**: Zero coupling exists today — `LearnMode.ts` line 45 destructures `entries` from options once at construction and never revisits it; no `updateFilter` method, no `onClearFilter` option, no filter-chip DOM element anywhere in the file (verified via read of lines 1-80 and prior codebase-analysis). Gap matches spec Section 2 exactly.
- **Active-filter chip UI**: No `.filter-chip` class exists in `theme.css` (verified absent from the codebase-analysis's cited style regions; only `.chip`/`.chip.active`/`.chip.more` exist, which are `FilterBar`'s own row, not Learn Mode's topbar). Gap matches spec Section 3.
- **Shared `EmptyState` component**: `src/components/EmptyState.ts` does not exist (confirmed via directory listing — only `AppShell.ts`, `BrowseGrid.ts`, `Card.ts`, `FilterBar.ts`, `LearnMode.ts` are present in `src/components/`). Gap matches spec Section 4.

### Incomplete Features
- **`BrowseGrid.ts`'s `renderEmptyState()`**: fully functional today (lines 64-88) but hardcoded/local — needs extraction into the parameterized shared component without behavior change for Browse itself.
- **`computeBucketCounts` call sites**: function itself (`storage.ts` lines 69-88) is already generic and needs no change; the gap is purely at call sites in `LearnMode.ts` and `BrowseGrid.ts`, which currently pass the full glossary and need to pass the filtered subset instead.

### Behavioral Changes Needed
- Learn Mode's draw pool: from "always the full 159-entry glossary" to "always `applyFilters(entries, activeFilterState)`."
- Learn Mode's stats readout: from "computed over full glossary" to "computed over active filtered subset."
- Filter persistence: from "resets to defaults every reload" (current `BrowseGrid.ts` line 28 local state) to "hydrated from localStorage at `AppShell` construction."

## User Journey Impact Assessment

| Dimension | Current | After | Assessment |
|-----------|---------|-------|------------|
| Reachability | Browse filter is Browse-only; Learn Mode unreachable from any filter state | Same navigation paths (tab switch Browse→Learn), now filter-aware automatically | Positive — zero new navigation steps, purely automatic propagation per spec's "no confirmation step" constraint |
| Discoverability | N/A (feature doesn't exist) | New chip in Learn Mode topbar, visible only when a filter is active, standard chip/pill visual language reused from `FilterBar` | 8/10 — appears in the primary viewport the instant a filter is active, reuses an established visual pattern (`.chip.active`), includes explicit clear affordance (✕) |
| Flow Integration | Users must manually re-apply filters every session with no cross-mode effect | Filter set once in Browse persists across reloads and automatically scopes Learn Mode | Positive — directly serves the stated user need (focused-topic study without re-filtering); no extra steps introduced |
| Multi-Persona | N/A | Creator persona (primary beneficiary) unaffected in Browse's own UI/behavior; Recruiter/Visitor persona's Browse-exploration journey explicitly unaffected per brief.md | No negative impact on secondary persona — confirmed in brief.md "Target Users" section, not re-litigated here |

Note: full persona re-exploration was explicitly skipped in the product-design phase (documented in `brief.md`) as this is enhancement-scope reusing existing personas — consistent with this being a already-approved, non-novel-persona change.

## Data Lifecycle Analysis

### Entity: `PersistedFilterState` (browse filter state)

| Operation | Backend (storage.ts) | UI | Access | Status |
|-----------|---------|-----|--------|--------|
| CREATE (first write) | `writeFilterState()` — new function, spec Section 1, mirrors existing `writeProgress()` pattern exactly | Any `FilterBar` interaction (chip toggle, level select) — existing UI, no new input surface needed | Fires automatically via `AppShell.handleFilterChange()` on every `onFilterChange` bubble — no dead-end, immediate | ✅ (once implemented per spec) |
| READ | `readFilterState()` — new function, defensive fallback to `defaultPersistedFilterState()` | `AppShell` hydrates at construction, passes to `BrowseGrid`(`initialFilterState`)/`FilterBar`(`initialState`)/`LearnMode` (via `applyFilters`) | Renders immediately on app load — chips/level-toggle in Browse show hydrated state, Learn Mode's chip/pool reflect it too | ✅ (once implemented per spec) |
| UPDATE | Same `writeFilterState()` call path (full overwrite, not partial patch — matches existing `writeProgress()` convention) | Existing `FilterBar` controls (no new controls needed for update, reuses existing category/level toggles) | Same automatic propagation as CREATE | ✅ (once implemented per spec) |
| DELETE / CLEAR | `writeFilterState({ selectedCategories: [], selectedLevel: 'All' })` via existing `FilterBar.reset()` (Browse's "Clear filters" button, untouched) OR new Learn Mode chip's ✕ (`onClearFilter` → same `handleFilterChange` path) | Two entry points: Browse's existing `clearBtn`/`reset()`, and the new Learn Mode filter-chip ✕ | Both paths converge on the identical `handleFilterChange` code path per spec Section 3 — no divergent clear logic | ✅ (once implemented per spec) — this is a notably clean design: no duplicate clear-logic to maintain |

**Completeness**: 100% (by design in the spec — this is not a gap-discovery finding but a verification that the spec itself leaves no CRUD hole)

**Orphaned Operations**: none found. Verified via three-layer check:
- Layer 1 (Backend): `readFilterState`/`writeFilterState` both specified with concrete implementations (Section 1).
- Layer 2 (UI Component): existing `FilterBar` controls handle write-triggering input; new `EmptyState`/chip handle clear-triggering input; no new component needed for basic read/write since `FilterBar` already exists and is being hydrated, not rebuilt.
- Layer 3 (User Access): `AppShell` is confirmed (via codebase-analysis's data-flow trace) to wire hydration into both `BrowseGrid`/`FilterBar` (Browse side) and `LearnMode` (Learn side) at construction — no scenario where persisted state is written but never read, or read but never surfaced.

**Missing Touchpoints**: none identified. The one adjacent touchpoint — progress stats display — is explicitly and correctly addressed in spec Section 5 (scoped to filtered subset) rather than omitted.

### Entity: Progress (`readProgress`/`writeProgress`/`resetProgress`) — explicitly OUT of scope for changes
Verified via direct grep of `storage.ts`: existing functions require zero modification. Spec Section 5 explicitly confirms progress stays keyed by entry `id` against the full glossary regardless of active filter — this is a deliberate non-goal, not an overlooked gap. No decision needed; already settled in Phase 2 per the spec's own "Open Questions/Risks: None" declaration.

## Defect Analysis
Not applicable — `has_reproducible_defect` is false. This is a net-new capability addition to existing components, not a bug fix. No reproduction data, root-cause hypothesis, or regression-risk-from-defect analysis applies. (Standard regression risk from modifying shared files is covered under Risk Assessment below.)

## Issues Requiring Decisions

No critical or important decisions remain open. Both clarifications already on record (scope fixed to spec; `EmptyState` extraction approved) cover the two decision points that would otherwise have been raised here. Cross-checking against the Decision Generation Rules:

- **Orphaned operations**: none found (see Data Lifecycle Analysis above) — no decision needed.
- **Three-layer verification failures**: none — all three layers (backend/UI/access) are specified for every operation.
- **Missing touchpoints**: none identified beyond what the spec already addresses.

The single implementation-detail note (mutable `entries` binding in `LearnMode.ts`, see Open Questions/Risks above) does not rise to a decision — it has one obvious correct resolution with no meaningful alternative, and does not change scope, behavior, or the spec's intent. It is surfaced for the implementation-planner's benefit, not as something requiring user input.

## Recommendations
- Proceed directly to specification/planning using `feature-spec.md` as the primary input, per the codebase-analysis's own recommendation — no additional requirements-gathering is warranted given the spec's completeness and this analysis's confirmation of zero drift.
- Implementation-planner should explicitly account for the `LearnMode.ts` mutable-`entries` detail when sequencing the `updateFilter()` work, to avoid a last-minute TypeScript compile error (`const` reassignment) during implementation.
- Preserve the sequencing already recommended in codebase-analysis.md: extract `EmptyState.ts` first (self-contained, de-risks the rest) → `storage.ts` functions → `AppShell` mediator wiring → `FilterBar`/`BrowseGrid` hydration+propagation → `LearnMode` (updateFilter, chip, empty-state, stats) last.
- No scope expansion recommended — the spec's CRUD/touchpoint coverage is already complete.

## Risk Assessment
- **Complexity Risk**: Low-Medium — no new external dependencies, no breaking signature changes; complexity comes from touching 5 files' state-threading simultaneously, not from any single file's internal logic.
- **Integration Risk**: Low — `AppShell`-as-mediator preserves the existing "no sibling coupling" architecture pattern already used elsewhere in the codebase (`FilterBar`→`BrowseGrid`), so this is pattern-consistent, not pattern-breaking.
- **Regression Risk**: Low-Medium, concentrated specifically in: (1) the propagation chain across `FilterBar`→`BrowseGrid`→`AppShell`→`LearnMode` being wired correctly in both directions, and (2) `LearnMode`'s new empty-subset path (genuinely new interaction surface with no direct precedent in `LearnMode.ts` itself, though `BrowseGrid`'s existing empty-state swap in `renderContent()` is a close analog). The 31-test regression baseline (confirmed via direct count: 5+9+6+3+4+4 across `AppShell.test.ts`, `BrowseGrid.test.ts`, `LearnMode.test.ts`, `storage.test.ts`, `filters.test.ts`, `learnAlgorithm.test.ts`) is the correct acceptance gate; `Card.test.ts` (7 tests) is out of scope for this feature and correctly excluded from that baseline.
