# Code Review Report

**Date**: 2026-07-05
**Path**: Learn Mode filtered-subset feature (src/components/EmptyState.{ts,test.ts}, src/lib/storage.{ts,test.ts}, src/components/FilterBar.ts, src/components/BrowseGrid.{ts,test.ts}, src/components/AppShell.{ts,test.ts}, src/components/LearnMode.{ts,test.ts}, src/styles/theme.css)
**Scope**: all (quality, security, performance, best practices)
**Status**: ⚠️ Issues Found

## Summary
- **Critical**: 0 issues
- **Warnings**: 3 issues
- **Info**: 5 issues

All 42 existing/updated tests in the touched files pass (`npx vitest run` on the six test files), and `tsc --noEmit` is clean. No XSS/injection risk was found — all DOM string insertion in the diff uses `textContent`/`className` assignment or `createElement`, never `innerHTML` with interpolated data (the two `innerHTML = ''` call sites in `BrowseGrid.ts` and `FilterBar.ts` are clears, not writes).

## Critical Issues

None found.

## Warnings

### 1. `readFilterState()` validates "is an object" but not field shape — a malformed-but-object-shaped value crashes app bootstrap
**Location**: `src/lib/storage.ts:80-95` (consumed at `src/components/AppShell.ts:54`, `src/lib/filters.ts:24-41`)

`readFilterState` only checks `parsed && typeof parsed === 'object'`; it never checks that `selectedCategories` is an array or that `selectedLevel` is one of the four valid values. If localStorage under `skillflip:browse-filter-state` ever holds an object missing `selectedCategories` (e.g. `{}`, a future schema change, a browser extension, or manual tampering via devtools), `readFilterState()` returns `{ selectedLevel: undefined }` with `selectedCategories: undefined`.

`AppShell.ts:54` spreads this straight into the working `filterState` (`{ ...readFilterState(), searchQuery: '' }`) with no further validation, and passes it to `applyFilters(entries, filterState)` at construction time (`AppShell.ts:83`). `applyFilters` (`src/lib/filters.ts:29`) calls `state.selectedCategories.length`, which throws `TypeError: Cannot read properties of undefined (reading 'length')` for any non-empty entries array.

I verified this is reachable and reproduces a real crash: reproduced live against the actual modules (`readFilterState()` + `applyFilters()` with `localStorage['skillflip:browse-filter-state'] = '{}'` and one non-empty entry) — confirmed `TypeError` thrown synchronously.

This crash *is* caught by `main.ts`'s top-level `try/catch` in `bootstrap()` (since `createAppShell(...)` runs inside that block), so the user sees the generic "Something went wrong loading the glossary data. Please try again later." error screen rather than a silent blank page — but that message is misleading (it blames glossary-data loading, not filter-state corruption) and the whole app becomes unusable until the user manually clears `localStorage`, even though `defaultPersistedFilterState()` was clearly intended as the safe fallback for exactly this situation.

**Why it matters**: `readFilterState`'s own doc comment says "Falls back to defaults if absent or malformed" — the current implementation only honors that promise for parse failures and non-object values, not for objects with missing/wrong-typed fields. This is a validation-early / type-check gap per the project's Global Validation standard ("Type and Format Checks: Validate data types, formats, ranges, and required fields systematically").

**Recommendation**: Add field-level validation to `readFilterState`, e.g.:
```ts
export function readFilterState(): PersistedFilterState {
  const raw = localStorage.getItem(FILTER_STATE_KEY);
  if (!raw) return defaultPersistedFilterState();
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedFilterState> | null;
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.selectedCategories) &&
      typeof parsed.selectedLevel === 'string'
    ) {
      return {
        selectedCategories: parsed.selectedCategories,
        selectedLevel: parsed.selectedLevel as Level | 'All',
      };
    }
    return defaultPersistedFilterState();
  } catch {
    return defaultPersistedFilterState();
  }
}
```
(Optionally also validate `selectedLevel` against the `['All', 'Junior', 'Regular', 'Senior']` allowlist and filter `selectedCategories` entries against the known `Category` taxonomy, consistent with the "Allowlists Over Blocklists" standard — an unrecognized category/level currently degrades silently to "never matches"/"garbage label text" rather than crashing, so that part is lower risk, but tightening it would fully close the gap.)

---

### 2. `localStorage.setItem` calls are unguarded against quota/availability failures
**Location**: `src/lib/storage.ts:71` (`writeProgress`), `src/lib/storage.ts:102-110` (`writeFilterState`)

Both write paths call `localStorage.setItem(...)` directly with no `try/catch`. In Safari private browsing (historically), or when storage quota is exceeded (large `learn-progress` map growth is unlikely here given the fixed glossary size, but still), `setItem` throws a `DOMException` (`QuotaExceededError`, or a `SecurityError` in privacy-restricted contexts). This diff introduces a second unguarded write site (`writeFilterState`) alongside the pre-existing `writeProgress`, doubling the surface for this.

An uncaught throw here happens inside a DOM event handler (`FilterBar`'s chip/level-toggle click handlers → `onChange` → `AppShell.handleFilterChange` → `writeFilterState`), not inside `main.ts`'s bootstrap `try/catch`, so it is not caught anywhere and will surface as an unhandled exception, silently breaking the filter-change flow (the click appears to do nothing further, mark row / stats never update) with no user-visible message.

**Why it matters**: Violates the project's Error Handling standard ("Resource Cleanup" / graceful degradation for non-critical services — persistence here is a nice-to-have, not something that should break interaction if it fails) and Global Validation's "fail fast but don't crash the whole flow" spirit.

**Recommendation**: Wrap both `setItem` calls in `try/catch` and degrade gracefully (log via `console.warn` and continue without persisting), matching the pattern already used for `readProgress`/`readFilterState`'s read-side resilience:
```ts
export function writeFilterState(state: PersistedFilterState): void {
  try {
    localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
      selectedCategories: state.selectedCategories,
      selectedLevel: state.selectedLevel,
    }));
  } catch {
    // Non-critical: filter state simply won't persist across reloads.
  }
}
```

---

### 3. `AppShell.destroy()` does not remove the tab-bar / exit-button listeners it attaches
**Location**: `src/components/AppShell.ts:141-147` (`learnTabBtn`/`browseTabBtn`/`exitBtn` listeners), `AppShell.ts:154-157` (`destroy`)

`destroy()` tears down `learnMode` and `browseGrid` but never removes the three listeners `AppShell` itself attaches (`learnTabBtn.click`, `browseTabBtn.click`, `exitBtn.click`). This is pre-existing structure (not newly introduced by this diff — `LearnMode`'s exit-button wiring in `AppShell.ts:146-147` is new, but the pattern of un-cleaned-up top-level listeners already existed for the tab buttons). Since `AppShell` is mounted once for the lifetime of the page (per `main.ts`, there's exactly one `createAppShell` call, never re-created), this is not a practical leak today. Flagging as Info-adjacent-Warning because the newly-added `exitBtn` listener (`AppShell.ts:147`) follows the same gap, and `AppShellInstance.destroy()`'s own doc comment ("Tears down nested view instances **and listeners owned by this instance**") is not fully honored — it only tears down nested instances, not its own three listeners.

**Recommendation**: If `destroy()` is expected to be called in a context where `AppShell` might be recreated (e.g. future test isolation, hot-reload, or a multi-instance scenario), track and remove these three listeners in `destroy()`. If `AppShell` is truly a page-lifetime singleton, consider updating the doc comment to say so explicitly rather than promising full listener teardown.

## Informational

### 4. `EmptyState`'s hardcoded icon glyph is a minor coupling, but is explicitly justified
**Location**: `src/components/EmptyState.ts:8-10`

The component's own doc comment already justifies this per the minimal-implementation standard (no speculative `icon` prop until a second glyph is actually needed). No action needed; noting only because it's the kind of decision the Standards Evolution note in `CLAUDE.md` asks to flag if it recurs — if a third empty-state variant with a different icon appears later, this is the point to promote it to an option.

### 5. `formatFilterLabel` builds a trailing `'  ✕'` (two spaces + close glyph) into the button's `textContent`, not via CSS `::after` or an `aria-hidden` icon element
**Location**: `src/components/LearnMode.ts:53-67`, consumed at `LearnMode.ts:146`

The "✕" clear-affordance is baked directly into the same `textContent` as the human-readable filter label (e.g. `"Java, DevOps · Senior  ✕"`). Screen readers will read the whole string including the "✕" as one label (mitigated somewhat since `filterChip` already has `aria-label="Clear active filter"`, which takes precedence over `textContent` for accessible name — so this is not a functional a11y bug, just a minor code-smell: presentation glyph mixed into computed display text makes `formatFilterLabel`'s output harder to unit-test independently of the icon and harder to restyle later).

**Suggestion**: Consider rendering the "✕" as a separate child `<span aria-hidden="true">` appended after the text node, decoupling the label-formatting logic from the close-icon rendering. Not urgent given the existing `aria-label` already covers accessibility.

### 6. `LearnMode.ts`'s `mark()` / `advanceToNextCard()` re-read `readProgress()` from localStorage on every single card draw and every mark
**Location**: `src/components/LearnMode.ts:247, 258, 262, 275, 290, 295`

Not a new issue introduced by this diff (pre-existing pattern), but the filtered-subset feature adds more call sites that follow the same pattern (`renderFromCurrentState` in the new `updateFilter` path also re-reads/re-parses the full progress map from localStorage + JSON on every filter change, in addition to every mark). For the current dataset size (tens to low hundreds of glossary entries), this is a non-issue performance-wise (JSON.parse of a small object is sub-millisecond). Flagging only as a forward-looking note: if the glossary grows by 1-2 orders of magnitude, repeated full-map re-reads per draw/mark would be worth caching/batching. No action recommended now — consistent with "build only what you need."

### 7. `BrowseGrid.ts`'s `createTile`'s `toggle()` re-dispatches a synthetic `MouseEvent('click')` on Card's internal `.flip-trigger` to flip state, rather than calling a public API
**Location**: `src/components/BrowseGrid.ts:133-141`

Pre-existing pattern (not introduced by this diff), already self-documented in the surrounding comment as a deliberate trade-off ("Card exposes flip only via its own DOM trigger, not a public toggle method"). Noting only for completeness since `BrowseGrid.ts` is in the reviewed file set; no new risk introduced by this feature's changes to this file (`initialFilterState`/`onFilterChange` additions are isolated to `createBrowseGrid`'s options handling and don't touch `createTile`).

### 8. `LearnMode.test.ts` and `AppShell.test.ts` do not cover the malformed-`readFilterState`-input path
**Location**: `src/lib/storage.test.ts:111-122` covers malformed/absent/non-object JSON for `readFilterState`, but no test in `AppShell.test.ts` exercises what happens when `readFilterState()` returns a shape with missing fields (the scenario in Warning #1) all the way through `AppShell` construction.

**Suggestion**: Once Warning #1 is fixed, add a regression test seeding `localStorage['skillflip:browse-filter-state'] = '{}'` before `createAppShell(...)` and asserting the shell mounts successfully with the default (unfiltered) state, to lock in the fix and prevent recurrence.

## Metrics
- Max function length (new/changed code): `createLearnMode` (~230 lines total factory, largest single unit `renderFromCurrentState`/`showCardForCurrentEntry` sub-functions each well under 50 lines) — no single function exceeds ~30 lines.
- Max nesting depth: 3 levels (e.g. `readFilterState`'s try/if/return) — within the project's implicit norms, no 4+ level nesting introduced.
- Potential vulnerabilities: 0 (no XSS/injection paths; all DOM writes use `textContent`/`createElement`).
- N+1 query risks: N/A (no backend/database — client-only static site per project tech stack).
- Unguarded localStorage writes: 2 (`writeProgress`, `writeFilterState`) — see Warning #2.
- Shape-unvalidated localStorage reads: 1 (`readFilterState`) — see Warning #1.

## Prioritized Recommendations
1. **Fix `readFilterState` field-shape validation** (Warning #1) — this is the one finding with a demonstrated crash path reachable from ordinary (if unlikely) localStorage corruption, and it's a small, contained fix in `src/lib/storage.ts` with an existing test file (`storage.test.ts`) ready to extend.
2. **Wrap `writeProgress`/`writeFilterState` in try/catch** (Warning #2) — cheap, low-risk hardening that prevents an unhandled exception from silently breaking the filter-toggle interaction path.
3. **Decide on and document `AppShell.destroy()`'s listener-cleanup contract** (Warning #3) — either implement full teardown or narrow the doc comment to match current (page-lifetime-singleton) reality; low priority since it's not causing observable problems today.
4. Optional polish: separate the "✕" glyph from `formatFilterLabel`'s text output (Info #5), and add a regression test for the Warning #1 fix (Info #8).

## Structured Result

```yaml
status: "issues_found"
report_path: ".maister/tasks/development/2026-07-04-learn-filtered-subset/verification/code-review-report.md"

summary:
  critical: 0
  warning: 3
  info: 5
  files_analyzed: 12

issues:
  - source: "code_review"
    severity: "warning"
    category: "quality"
    description: "readFilterState() checks 'is an object' but not field shape/types; a malformed-but-object-shaped persisted value (e.g. '{}') propagates undefined selectedCategories into applyFilters(), throwing a TypeError caught only by main.ts's generic bootstrap error screen."
    location: "src/lib/storage.ts:80-95"
    fixable: true
    suggestion: "Validate Array.isArray(parsed.selectedCategories) and typeof parsed.selectedLevel === 'string' before accepting the parsed object; fall back to defaultPersistedFilterState() otherwise."
  - source: "code_review"
    severity: "warning"
    category: "best_practices"
    description: "writeProgress and writeFilterState call localStorage.setItem with no try/catch; a QuotaExceededError/SecurityError thrown from a DOM click handler (filter toggle) is unhandled and silently breaks the interaction."
    location: "src/lib/storage.ts:71 and src/lib/storage.ts:102-110"
    fixable: true
    suggestion: "Wrap both setItem calls in try/catch and degrade gracefully (log and continue without persisting)."
  - source: "code_review"
    severity: "warning"
    category: "quality"
    description: "AppShellInstance.destroy() doc comment promises tearing down 'listeners owned by this instance' but only calls learnMode.destroy()/browseGrid.destroy(); the tab-bar and exit-button click listeners AppShell itself attaches are never removed."
    location: "src/components/AppShell.ts:141-157"
    fixable: true
    suggestion: "Either track/remove the three listeners in destroy(), or narrow the doc comment since AppShell is currently a page-lifetime singleton with only one construction site in main.ts."
  - source: "code_review"
    severity: "info"
    category: "quality"
    description: "EmptyState's magnifying-glass icon glyph is hardcoded rather than a prop; already explicitly justified in the file's own doc comment per the minimal-implementation standard."
    location: "src/components/EmptyState.ts:8-10"
    fixable: false
    suggestion: "No action needed now; promote to a prop only if/when a second empty-state icon variant is actually needed."
  - source: "code_review"
    severity: "info"
    category: "best_practices"
    description: "formatFilterLabel bakes the '✕' close-glyph into the same textContent as the human-readable label rather than a separate aria-hidden child, making the function harder to test/restyle independently (not a functional a11y bug since filter-chip already has an explicit aria-label)."
    location: "src/components/LearnMode.ts:53-67"
    fixable: true
    suggestion: "Render the close icon as a separate <span aria-hidden=\"true\"> appended after the label text node."
  - source: "code_review"
    severity: "info"
    category: "performance"
    description: "LearnMode re-reads and JSON-parses the full progress map from localStorage on every card draw/mark/updateFilter call; a non-issue at current glossary scale, flagged only as a forward-looking note."
    location: "src/components/LearnMode.ts:247,258,262,275,290,295"
    fixable: false
    suggestion: "Revisit caching only if the glossary dataset grows by 1-2 orders of magnitude."
  - source: "code_review"
    severity: "info"
    category: "quality"
    description: "BrowseGrid's createTile.toggle() flips Card state by dispatching a synthetic click on Card's internal .flip-trigger rather than a public toggle API; pre-existing, already self-documented, unaffected by this diff's actual changes to the file."
    location: "src/components/BrowseGrid.ts:133-141"
    fixable: false
    suggestion: "No action needed; noted for completeness only."
  - source: "code_review"
    severity: "info"
    category: "testing"
    description: "No regression test exercises AppShell construction when readFilterState() returns a shape with missing fields (the scenario underlying Warning #1)."
    location: "src/components/AppShell.test.ts"
    fixable: true
    suggestion: "Add a test seeding localStorage['skillflip:browse-filter-state'] = '{}' before createAppShell(...) once the Warning #1 fix lands, asserting the shell mounts with default (unfiltered) state instead of throwing."

issue_counts:
  critical: 0
  warning: 3
  info: 5
```
