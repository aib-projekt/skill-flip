# Specification Audit: Learn Mode Respects Browse's Filtered Subset (Dev Spec)

Audited: `.maister/tasks/development/2026-07-04-learn-filtered-subset/implementation/spec.md`
Against upstream ground truth: `.maister/tasks/product-design/2026-07-04-learn-filtered-subset/analysis/feature-spec.md`
Against live codebase at HEAD (branch `maister-init-docs`, clean working tree, commit `51b225b`).

Note: this file replaces an earlier audit draft that was based on a stale reading of `AppShell.ts`. Re-verified directly against the current file contents below; the earlier draft's "Critical: AppShell architecture mismatch" finding does not reproduce against the live file as it exists now (see Fidelity/Live Codebase Verification sections) and has been dropped.

## TL;DR
The dev spec is compliant. All 6 upstream sections are covered, the critical schema/key fidelity check passes exactly (`PersistedFilterState { selectedCategories, selectedLevel }` / `skillflip:browse-filter-state` — no drift from the earlier erroneous pattern-mining inference), and every quoted line number and code claim was independently verified against the live source, including `AppShell.ts`'s current shape (which matches what the dev spec assumes: `AppShellState` today has only `activeTab`, no filter state, no shared topbar — exactly the gap the dev spec describes closing). The 31-test baseline is exact, confirmed by both a grep count and an actual `npx vitest run` (44/44 passing including out-of-scope files). Zero Critical or High findings. Two Low findings, both about cross-reference completeness, not correctness.

## Key Decisions
- Verified `AppShell.ts` directly against the dev spec's claims rather than trusting any prior audit pass — read the full live file (127 lines). It currently owns only `activeTab` in `AppShellState`, mounts `LearnMode`/`BrowseGrid` with plain `{ entries }`, and has no filter-state field or mediator method — this is exactly the "gap" state the dev spec's Requirement 2 describes needing to close, not a mismatch with it.
- Treated the "9 core requirements" count as a literal, independently-verifiable claim — counted the numbered list in `## Core Requirements` directly; got exactly 9, confirming the claim.
- Did not penalize the dev spec for omitting an explicit enumeration of `LearnMode.ts`'s 5 `entries` reference sites (lines 49, 136, 140, 153, 172) in its "mutable binding" Key Decision bullet — the omission doesn't block implementation since Requirement 8 separately and adequately specifies the stats-scoping call-site behavior; classified as Low, not Medium, on that basis.

## Open Questions / Risks
- None that block implementation. The dev spec explicitly and correctly carries forward the upstream's "Open Questions/Risks: None" status with its own justification, and independent verification found no contradiction.

---

## Summary

**Compliance status: Mostly Compliant** (functionally a pass — nothing here is blocking; see Minor Discrepancies for the only two findings).

The dev spec at `.maister/tasks/development/2026-07-04-learn-filtered-subset/implementation/spec.md` is a faithful, implementation-ready translation of the upstream `feature-spec.md`. It does not introduce alternative designs, does not silently drop any of the 6 upstream sections, and every checkable factual claim about the live codebase (line numbers, code snippets, test counts, current component shapes) was verified accurate against the actual files as they exist today.

## Completeness vs Upstream (Checklist Item 1)

All 6 upstream sections map cleanly onto the dev spec:

| Upstream Section | Dev Spec Coverage |
|---|---|
| 1. Data Model & Persistence Schema | Requirement 1 (`spec.md:28`) + Key Decision bullet 1 (`spec.md:7`) |
| 2. State Ownership & Component Wiring | Requirements 2–4 (`spec.md:29-31`) + Technical Approach data-flow paragraph (`spec.md:67`) |
| 3. Active-Filter Indicator UI | Requirement 5 (`spec.md:32`) + Visual Design section (`spec.md:38-45`) |
| 4. Empty-Subset Handling | Requirements 6–7 (`spec.md:33-34`) |
| 5. Progress Tracking & Stats Scoping | Requirements 8–9 (`spec.md:35-36`) + "Progress-tracking persistence... requires zero changes" Key Decision (`spec.md:10`) |
| 6. Testing Requirements | Implementation Guidance → Testing Approach (`spec.md:82-91`) — enumerates all 6 test files' new cases, matching upstream Section 6 |

No omissions found. Nothing from the upstream's 6 sections is missing from the dev spec.

## Fidelity to the Authoritative Source — Critical Check (Checklist Item 2)

**Upstream** (`feature-spec.md:19-30`):
```
interface PersistedFilterState {
  selectedCategories: Category[];
  selectedLevel: Level | 'All';
}
```
> "This is a strict subset of the existing `BrowseFilterState`... `searchQuery` is intentionally absent from the type, not merely omitted at runtime..."
> **Storage key**: `FILTER_STATE_KEY = 'skillflip:browse-filter-state'`

**Dev spec** (`spec.md:7`):
> "Persisted schema is exactly `PersistedFilterState { selectedCategories: Category[]; selectedLevel: Level | 'All' }` under key `skillflip:browse-filter-state` — `searchQuery` is structurally absent from the type, not just excluded at runtime. (Source: feature-spec Section 1 — authoritative; **overrides an earlier generic-convention inference from pattern-mining.**)"

Also restated identically in Requirement 1 (`spec.md:28`): "storing only `{ selectedCategories, selectedLevel }` under `localStorage` key `skillflip:browse-filter-state`."

**Verification**: `grep -n "skillflip:"` across `src/lib/storage.ts` and both spec files confirms:
- Live code today only has `STORAGE_KEY = 'skillflip:learn-progress'` (`storage.ts:32`) — the new key does not exist yet, consistent with this being a not-yet-implemented gap.
- The dev spec's key string (`skillflip:browse-filter-state`) is a byte-for-byte match to the upstream's (`feature-spec.md:30`).
- The dev spec's schema field names/types (`selectedCategories: Category[]`, `selectedLevel: Level | 'All'`) exactly match the upstream's, and both match the live `Category`/`Level` type definitions in `src/types/glossary.ts:10-24`.

**Finding**: No drift. The earlier pattern-mining error (a generic 3-field schema / different key name, referenced in `codebase-analysis.md:14/225` and `gap-analysis.md` as the two Explore agents' disagreement) was correctly **not** carried forward into the final dev spec. The dev spec explicitly calls out that it overrides that inference (`spec.md:7`), which is itself good practice — it makes the correction traceable rather than silent.

**Category**: N/A (pass, not a gap). **Severity**: N/A.

## Live Codebase Verification (Checklist Item 3)

### `src/components/AppShell.ts` — current shape vs. dev spec's assumptions

Live file read in full (127 lines). Current state:
- `AppShellState` (`AppShell.ts:30-32`) has only `activeTab: AppShellTab` — no `filterState` field.
- `createAppShell()` (`AppShell.ts:43-58`) mounts `createLearnMode({ entries })` and `createBrowseGrid({ entries })` with the plain, full `entries` array and no filter/callback wiring.
- No `handleFilterChange` method, no `readFilterState`/`writeFilterState` import, no shared topbar (the file's own docstring at lines 7-22 explicitly states "It does NOT render a shared topbar — each mounted view... supplies its own").

This matches — not contradicts — the dev spec's description of the *current* gap. The dev spec's Requirement 2 (`spec.md:29`) describes exactly this transition: "`AppShell` hydrates `BrowseFilterState`... A new `handleFilterChange(newState)` method..." — i.e., it correctly describes `AppShell` gaining these things, consistent with them being absent today. The dev spec never claims `AppShell` currently has a shared topbar or filter state; it only describes the target state. No mismatch found here.

### `src/components/BrowseGrid.ts` — `renderEmptyState()`

Live file, lines 64-88, confirmed verbatim:
```typescript
function renderEmptyState(): HTMLElement {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  const icon = document.createElement('div');
  icon.className = 'empty-icon';
  icon.textContent = '\u{1F50D}';
  const heading = document.createElement('h2');
  heading.textContent = 'No terms match';
  const helper = document.createElement('p');
  helper.textContent = 'Try clearing a filter or search a different term.';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = 'Clear filters';
  clearBtn.addEventListener('click', () => { filterBar.reset(); });
  emptyState.append(icon, heading, helper, clearBtn);
  return emptyState;
}
```
Matches exactly what the dev spec (Requirement 7, `spec.md:34`) claims will be extracted: same heading (`"No terms match"`), same body copy (`"Try clearing a filter or search a different term."`), same action label (`"Clear filters"`) and `filterBar.reset` action. The dev spec's line-range citation ("lines 64-88") is exact.

### `src/components/LearnMode.ts` — `entries` binding

Live file, line 45: `const { entries } = options;` — confirmed exactly as the dev spec claims (`spec.md:11`, `spec.md:76`: "`LearnMode.ts` line 45 currently does `const { entries } = options`"). This is a real `const` destructure today; the dev spec's claim that `updateFilter()` will require converting it to a mutable local is technically necessary (TypeScript rejects reassigning a `const`-bound destructured value) — verified correct, not a spec invention.

Downstream reads of `entries` in the live file (grep-confirmed): lines 49, 136, 140, 153, 172 — five call sites, not just the two the dev spec explicitly names by number (49, 136). The dev spec's Key Decision bullet (`spec.md:11`) doesn't enumerate 140/153/172 (the three `renderProgressStats` calls). Not a blocking gap — Requirement 8 separately mandates stats calls use the filtered subset — but the cross-reference between the "mutable binding" note and the "stats scoping" requirement is implicit rather than stated together. See Minor Discrepancies, Finding 2.

### `src/lib/storage.ts` — `readProgress`/`writeProgress` pattern

Live file, lines 32-62, confirmed: `STORAGE_KEY` constant (line 32), `readProgress()` with try/catch + type-guard fallback to `{}` (lines 35-50), `writeProgress(id, entry)` read-modify-write (lines 53-57), `resetProgress()` via `removeItem` (lines 60-62). The dev spec's claim (`spec.md:52`, sourced from upstream `feature-spec.md:32-56`) that new `readFilterState`/`writeFilterState` "mirror this pattern near line-for-line" holds up structurally: same try/catch-and-fallback shape, same single-key read-modify-write shape. One nuance: live `readProgress()` only checks `typeof parsed === 'object'`, while the upstream's `readFilterState()` snippet (`feature-spec.md:38-51`) additionally validates each field's shape (`Array.isArray`, per-field `typeof` checks) — a stricter defensive pattern than the existing `readProgress()`. Not flagged by the dev spec as a deviation from "mirrors exactly"; it's a reasonable/beneficial strengthening, not an error, but "mirrors exactly" is very slightly imprecise phrasing. See Minor Discrepancies, Finding 1.

### Test counts

Verified two ways: (1) `grep -cE "^\s*(it|test)\("` per file, and (2) an actual `npx vitest run --reporter=verbose` execution.

| File | Count |
|---|---|
| `src/lib/storage.test.ts` | 3 |
| `src/components/AppShell.test.ts` | 5 |
| `src/components/BrowseGrid.test.ts` | 9 |
| `src/components/LearnMode.test.ts` | 6 |
| `src/lib/filters.test.ts` | 4 |
| `src/lib/learnAlgorithm.test.ts` | 4 |
| **Sum (the 6 files the dev spec baselines)** | **31** |
| `src/components/Card.test.ts` (correctly excluded from baseline) | 7 |
| `src/main.test.ts` (not part of either spec's baseline) | 3 |
| `src/types/glossary.test.ts` (not part of either spec's baseline) | 3 |
| **Full suite total** | **44** |

`npx vitest run` confirms `PASS (44) FAIL (0)` at the current, pre-implementation HEAD. The dev spec's claim (`spec.md:90`: "all 31 existing tests (5 `AppShell.test.ts` + 9 `BrowseGrid.test.ts` + 6 `LearnMode.test.ts` + 3 `storage.test.ts` + 4 `filters.test.ts` + 4 `learnAlgorithm.test.ts`)") is exact, per-file and in total. `Card.test.ts`'s exclusion from the baseline is correctly justified (file is unaffected by this feature).

## Ambiguity Check (Checklist Item 4)

Searched for any dev-spec section that would force an implementer to make an undocumented judgment call not resolved by either spec. Findings:

- **No unresolved judgment calls found for the 9 core requirements themselves.** Every requirement cites concrete types, call sites, and copy strings.
- The one legitimately open implementation micro-decision — exactly how to restructure `LearnMode.ts`'s internals to support a mutable `entries`/`currentEntries` binding while keeping `renderProgressStats`'s 3 call sites and the chip-visibility computation all reading live filtered data — is correctly flagged by the dev spec as "a mechanical consequence of the feature, not a design choice" (`spec.md:76`) rather than left silently ambiguous. This is appropriate: it's a normal refactoring task with one obvious correct shape, not a design decision requiring stakeholder input.
- The dev spec explicitly and correctly declines to introduce a new decision for `FilterBar.test.ts`'s absence (Out of Scope, `spec.md:109`), matching upstream's explicit non-goal.

No new ambiguity was introduced by the dev spec relative to upstream.

## Implementability (Checklist Item 5)

**9 core requirements confirmed** by direct read of `## Core Requirements` (`spec.md:26-36`, numbered items 1–9). Assessment per requirement:

1. **Persist category/level filter** — Fully implementable: exact key, exact schema, exact function names given, template exists live (`storage.ts:32-62`).
2. **AppShell owns/mediates** — Fully implementable: exact hydration expression, exact `handleFilterChange` steps enumerated; verified consistent with `AppShell.ts`'s current (pre-feature) shape.
3. **Filter changes propagate upward** — Fully implementable: exact new optional fields named, exact callback-chain described, live callback site to modify identified (`BrowseGrid.ts:56-59`).
4. **Learn Mode redraws on filter change** — Fully implementable: exact new method signature given; live mechanics to imitate (`advanceToNextCard()`, `LearnMode.ts:134-141`) identified.
5. **Active-filter chip** — Fully implementable: exact visibility rule, exact label format with 3 documented examples, exact DOM insertion point (`between progressStats and resetBtn`, matches live topbar structure at `LearnMode.ts:62-71`), and a binding mockup reference (verified: `mockups/learn-mode-active-filter-chip.html` is byte-identical between the product-design and dev-task copies, and its embedded markup shows `<button class="filter-chip" ...>Java &middot; Senior&nbsp;&nbsp;&#10005;</button>` positioned exactly between `.progress-stats` and the reset `.icon-btn`, matching the dev spec's DOM-order claim).
6. **Empty-subset handling** — Fully implementable: exact trigger condition, exact copy strings, exact "never calls drawNextCard()" constraint.
7. **Shared EmptyState component** — Fully implementable: verbatim extraction source identified and quoted; new file path and factory signature given.
8. **Progress stats scope to subset** — Implementable, though as noted above the dev spec doesn't explicitly enumerate that this touches 3 specific existing call sites in `LearnMode.ts` (lines 140, 153, 172) plus 2 in `BrowseGrid.ts` (`renderProgressStats(progressStats, entries)` at `BrowseGrid.ts:183`, and inside `refreshStats` at `BrowseGrid.ts:188`) — an implementer following the prose would still arrive at the correct call sites by searching for `renderProgressStats`/`computeBucketCounts` usages, but the spec could have been more explicit. Low severity, does not block implementation.
9. **`resetProgress()` scope unaffected** — Fully implementable (a no-op requirement, correctly stated as such).

No requirement lacks sufficient detail to implement directly.

## Critical Issues

None found.

## Important Gaps

None found (no High or Critical severity findings).

## Minor Discrepancies

**Finding 1**: Dev spec's "mirrors `readProgress`/`writeProgress` near line-for-line" framing slightly understates that the upstream's proposed `readFilterState()` adds per-field defensive validation (`Array.isArray`, `typeof` checks) not present in the simpler existing `readProgress()` (which only checks `typeof parsed === 'object'`).

- **Spec Reference**: `spec.md:52` ("existing `STORAGE_KEY`/`readProgress`/`writeProgress`/`resetProgress` pattern (lines 32-62) is the direct template mirrored near line-for-line")
- **Evidence**: `src/lib/storage.ts:41-50` (`readProgress`, single `typeof parsed === 'object'` check) vs. upstream `feature-spec.md:38-51` (`readFilterState`, per-field `Array.isArray`/`typeof` checks)
- **Category**: Ambiguous framing (not incorrect)
- **Severity**: Low — the actual code to write is unambiguous (the exact validation logic is given via the upstream snippet the dev spec incorporates by reference); this only slightly overstates how closely the *shape* mirrors the existing function. No implementer would be misled into writing the wrong validation, since the concrete snippet exists in the referenced upstream doc.
- **Recommendation**: Optional wording tweak to "mirrors the read/write/key-constant *structure*" instead of "near line-for-line," if the dev spec is revised for any other reason. Not required before implementation.

**Finding 2**: The "mutable binding" Key Decision bullet names only lines 45/49/136 of `LearnMode.ts`, not the additional 3 `entries` reads at lines 140/153/172 that also need to switch to the mutable binding (and, per Requirement 8, to a filtered-subset argument).

- **Spec Reference**: `spec.md:11` (Key Decisions) and `spec.md:76` (Technical Approach implementation note)
- **Evidence**: `src/components/LearnMode.ts:140,153,172` — three `renderProgressStats(progressStats, entries)` calls not named in the dev spec's line citation, confirmed via `grep -n "entries" src/components/LearnMode.ts`
- **Category**: Ambiguous (incomplete cross-reference, not a wrong instruction)
- **Severity**: Low — Requirement 8 (`spec.md:35`) independently and correctly specifies that both `LearnMode`'s and `BrowseGrid`'s stat readouts must call with the filtered subset, so the correct end-state is still fully specified; only the "which exact lines does the mutable-binding refactor touch" cross-reference is incomplete. An implementer reading the whole spec (not just the one bullet) arrives at the right place. Does not block implementation.
- **Recommendation**: Optional — the implementation-planner could preemptively note in task-group scoping that `LearnMode.ts`'s refactor touches 5 read-sites of `entries`, not 2, to avoid under-scoping the mechanical change. Not required before implementation starts, since Requirement 8 already covers the functional requirement.

## Clarification Needed

None. Both the dev spec and its supporting analysis docs (`requirements.md`, `clarifications.md`, `gap-analysis.md`) show all open questions from the product-design phase were already resolved before this dev spec was written, and independent verification found no new ambiguity requiring stakeholder input.

## Extra Features

None found. Every new option/method/component in the dev spec (`initialFilterState`, `onFilterChange`, `initialState`, `updateFilter`, `onClearFilter`, `EmptyState.ts`, `.filter-chip`) traces to an explicit upstream requirement. No speculative additions.

## Recommendations

1. No changes required before proceeding to implementation planning — the dev spec is faithful and implementable as written.
2. Optional, non-blocking: when the implementation-planner scopes the `LearnMode.ts` task group, explicitly note it touches 5 `entries` read-sites (lines 45, 49, 136, 140, 153, 172 in the current file), not just the 2 named in the dev spec's own cross-reference, so the mechanical refactor isn't under-scoped relative to the stats-scoping requirement (Requirement 8).
3. Optional, non-blocking: soften "mirrors... near line-for-line" (`spec.md:52`) to acknowledge the new filter-state read function is slightly more defensive (per-field validation) than the existing `readProgress()`, to avoid any future reader assuming the two functions are structurally identical.

## Overall Verdict

**pass**
