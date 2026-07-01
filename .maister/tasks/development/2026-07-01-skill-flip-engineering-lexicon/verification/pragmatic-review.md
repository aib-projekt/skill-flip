# Pragmatic Code Review: Skill Flip — Engineering Lexicon

**Review date**: 2026-07-01
**Reviewer**: code-quality-pragmatist
**Scope**: Full implementation — `src/`, `content-pipeline/`, `scripts/`, `data/glossary.json`, `vite.config.ts`, `.github/workflows/deploy.yml`, `package.json`

---

## Executive Summary

**Status: Appropriate**

This is a well-scoped, deliberately minimal client-only static site. The "vanilla TypeScript, no framework" discipline is respected throughout — there are **zero runtime dependencies** in `package.json` (only `vite`, `vitest`, `typescript`, `jsdom`, `@types/node` as devDependencies), no classes, no framework-mimicking patterns (no virtual DOM, no reactive state layer, no event bus, no DI container, no router). Every component follows the same simple `create*()` factory-function pattern returning `{ element, getState, destroy }`. The content-pipeline tooling is a single hand-rolled validator with no schema library, proportionate to both the current 20-entry dataset and the documented future 150-term expansion.

I found **zero Critical or High severity issues**. Findings below are Low/informational — small documented deviations and minor code-organization notes, not architectural over-engineering.

**Findings by severity**: Critical: 0 · High: 0 · Medium: 0 · Low: 3

---

## 1. Vanilla TS Discipline — Verified Clean

Checked for framework-like creep via direct source inspection and grep across `src/`, `content-pipeline/`, `scripts/`:

- `grep` for `EventEmitter|EventBus|Observable|Subject|createStore|Container(|Provider|useState|useEffect|Proxy(|reactive(|computed(|watch(|class ` → **zero matches** in application code.
- No `class` declarations anywhere in `src/` — all components (`Card.ts`, `AppShell.ts`, `BrowseGrid.ts`, `FilterBar.ts`, `LearnMode.ts`) are plain factory functions (`createCard`, `createAppShell`, etc.) closing over local `const state` objects and manipulating real DOM nodes directly (`document.createElement`, `.append`, `.classList.toggle`).
- No router: `grep` for `location.hash|pushState|popstate|Router` found only a *test* asserting `window.location.hash` stays `''` after a tab switch — i.e., a test proving the absence of routing, not routing logic itself.
- `package.json` has **no runtime dependencies at all** — the entire app ships as hand-written DOM code plus CSS. This is the strongest possible evidence the "no framework" decision was honored, not just claimed.
- `vite.config.ts` is 33 lines: one custom plugin (`serveRootData`) that serves `data/glossary.json` from the repo root in dev and copies it to `dist/data/` on build, so both the browser `fetch()` and the Node-based validator share one canonical file. This is a reasonable, minimal solution to a real constraint (one data file, two consumers), not infra overkill.

**Conclusion**: no simplification needed here — this is exactly the level of restraint the spec called for.

---

## 2. Card.ts `variant: 'full' | 'tile'` Flag — Appropriate

`src/components/Card.ts:25,33-34,62-63,74,161-186,188-191`

The `CardVariant` type is a two-value union (`'full' | 'tile'`), consumed via a single ternary/if at each of its three use sites:
- Line 74: `shell.className = variant === 'tile' ? 'card-shell card-shell-tile' : 'card-shell'`
- Lines 161-186: `if (variant === 'full') { ...build nav row... }`
- Line 189: `root.className = variant === 'tile' ? 'card-root card-root-tile' : 'card-root'`

No strategy pattern, no factory-of-factories, no configuration object beyond the one flag plus two optional callbacks (`onNavigate`, `onSwipe`). This is the minimal idiomatic way to express "two rendering modes of one component" in vanilla TS — a config object with a discriminant field and plain conditionals, not an abstraction layer.

**One honest, already-documented limitation** (not a defect, just worth naming): per `BrowseGrid.ts:128-140` and the work-log's Group 4 notes, the `'tile'` variant's own DOM is never actually mounted for Browse grid tiles — `BrowseGrid.createTile()` uses `createCard({variant:'tile'})` purely as a flip-state engine and re-projects `card.getState().isFlipped` onto a hand-built flat `.tile` structure, because Card's actual `'tile'`-variant markup doesn't match the mockup's flat tile layout. This is a pragmatic workaround for a real markup mismatch, transparently documented inline (`BrowseGrid.ts:128-140`) and in the work-log, with a follow-up path noted ("future simplification opportunity if Card.ts ever gains a genuine flat tile-render path"). Not flagging as a finding — it's an honest trade-off, not hidden complexity.

---

## 3. AppShell View-Swap Mechanism — Appropriate

`src/components/AppShell.ts` (127 lines total)

The entire view-switching mechanism is:
- Two DOM containers (`learnContainer`, `browseContainer`), both mounted once at startup (`AppShell.ts:52-62`).
- One in-memory field, `state.activeTab: 'learn' | 'browse'` (`AppShell.ts:30-32,46`).
- A `switchTo()` function that sets the field and calls `render()`, which toggles `style.display` between `''` and `'none'` on the two containers (`AppShell.ts:83-101,103-107`).
- No router, no hash/URL state, no state-machine library, no lifecycle hooks system — exactly matching the spec's explicit instruction ("no routing library, no URL/hash state").

This is a textbook-minimal show/hide toggle. Keeping both views mounted (rather than tearing down/recreating) is a deliberate, sensible choice documented in the work-log — it preserves in-progress `Card` flip state across tab switches without needing any persistence mechanism beyond what already exists (`localStorage` for Learn progress).

---

## 4. Content-Pipeline Tooling — Proportionate (including forward-looking parts)

`content-pipeline/validate-glossary.ts` (164 lines), `prompt-template.md`, `rubric.md`

- **`validate-glossary.ts`**: a hand-written validator, zero schema-library dependency (no Zod/Ajv/Joi), doing exactly four things: array-shape check, required-string-field check, enum check (`Category`/`Level`), and duplicate-id/duplicate-(term,category) detection. All four checks map directly to actual `success criteria` bullets in `spec.md` (zero errors, no duplicate ids, no duplicate (term,category) pairs, all 12 categories/3 levels accepted). None of the validation rules are speculative — each one is traceable to a stated requirement.
- The 12-category/3-level enum lists are necessarily present now (`VALID_CATEGORIES`, `VALID_LEVELS`, `validate-glossary.ts:20-36`) because the *type system* already commits to the full 12-category taxonomy (`src/types/glossary.ts`) even though only Java is populated — this isn't the validator "anticipating" the 150-term future, it's the validator staying consistent with a data model decision already made and justified elsewhere in the spec. Reasonable.
- **`prompt-template.md`** and **`rubric.md`**: markdown documentation, no tooling/automation of their own — a prompt to paste into an LLM of the author's choosing, and a manual review checklist. This is about as low-infrastructure as AI-assisted content authoring can get: no CLI wrapper, no batch-processing script, no automatic LLM API integration. A human still pastes, reviews, and commits by hand (explicitly stated: "AI-*assisted*, not AI-*automated*").
- Decoupling from `src/` (own `node:test` runner instead of Vitest, hand-mirrored types instead of importing `src/types/glossary.ts`) avoids bundling dev/content tooling into the shipped app — a real, justified boundary given `content-pipeline/` explicitly must not be part of the Vite build.

**Assessment**: even accounting for the future 150-term expansion this tooling is meant to support, nothing here is over-built for that purpose either — no plugin system, no configurable rule engine, no multi-format export. It is sized for "one JSON file, hand-curated, occasionally regenerated with LLM assistance," which is exactly what both the current and future states need.

---

## 5. Unnecessary Flexibility / Configuration Creep — None Found

Checked each component's public options surface against actual call sites:

- `Card.ts`'s `CreateCardOptions` has exactly 4 fields (`entry`, `variant?`, `onNavigate?`, `onSwipe?`) — all consumed by at least one real call site (`LearnMode.ts:76-81` uses all four; `BrowseGrid.ts:142` uses `entry`+`variant` only, which is fine since tile mode doesn't need nav/swipe callbacks).
- `FilterBar.ts`'s `CreateFilterBarOptions` has 2 fields (`entries`, `onChange`) — both used by `BrowseGrid.ts:81-87`.
- No component exposes theming hooks, plugin slots, render-prop-style customization, or unused generic type parameters.
- `getState()`/`destroy()` are present on every component per a consistent instance-shape convention (`element/getState/destroy`), and both methods are in fact called by real consumers, not just by tests: `BrowseGrid.ts:149` and `LearnMode.ts:123` call `card.getState()`; `AppShell.ts:123-124` calls `learnMode.destroy()`/`browseGrid.destroy()`; `BrowseGrid.ts:217` calls `filterBar.destroy()`; `LearnMode.ts:206` calls `card.destroy()`. This is a consistent pattern, not speculative API surface.

---

## Low-Severity / Informational Notes

These are not over-engineering — listed for completeness and traceability, per the review's evidence-based mandate.

### L1. `AppShell.destroy()` is never invoked at the top level
**File**: `src/main.ts:45-46` vs `src/components/AppShell.ts:122-125`
**Evidence**: `main.ts` calls `createAppShell({...})` and appends `.element`, but never calls `.destroy()` — there is no SPA-level unmount scenario in a single-page static site that never re-bootstraps. `destroy()` is exercised only by `AppShell.test.ts`.
**Impact**: negligible — 4 lines of dead-in-production code that exist purely to keep the same `element/getState/destroy` shape consistent across every component (Card, FilterBar, LearnMode, BrowseGrid, AppShell all follow this shape, and several of those *are* actively used mid-app, e.g. `card.destroy()`, `filterBar.destroy()`). Breaking the pattern only for AppShell to save 4 lines would reduce consistency for no real gain.
**Recommendation**: no action needed. Note only, not a simplification target.

### L2. Two near-identical `renderProgressStats()` implementations
**Files**: `src/components/BrowseGrid.ts:44-69` and `src/components/LearnMode.ts:91-117`
**Evidence**: Both functions build the same three `<span class="stat ...">`/`<span class="dot">` DOM structure from `computeBucketCounts()`, differing only in a `&middot;` (HTML entity, BrowseGrid) vs `·` (literal character, LearnMode) — a cosmetically inconsequential difference likely from two different task groups (4 and 5) implementing the same spec requirement in parallel without a shared render helper.
**Impact**: ~25 lines of duplication; low risk since both call the same underlying `computeBucketCounts()` (the actual counting logic, correctly, is not duplicated — only the DOM-rendering of the result is).
**Before/after example**:
```ts
// Before: duplicated in both BrowseGrid.ts and LearnMode.ts
function renderProgressStats(): void {
  const counts = computeBucketCounts(entries);
  progressStats.innerHTML = '';
  const know = document.createElement('span');
  know.className = 'stat know';
  know.textContent = `${counts.mastered} mastered`;
  // ...5 more elements...
}

// After: one shared helper in src/lib/storage.ts or a new src/lib/progressStats.ts
export function renderProgressStatsInto(container: HTMLElement, entries: Glossary): void {
  const counts = computeBucketCounts(entries);
  container.innerHTML = '';
  container.append(
    statSpan('know', `${counts.mastered} mastered`),
    dotSpan(),
    statSpan('dontknow', `${counts.shaky} shaky`),
    dotSpan(),
    statSpan('unseen', `${counts.new} new`),
  );
}
```
**Estimated effort**: 15-20 minutes. Optional — this is genuinely minor duplication from parallel task-group execution, not a structural problem, and the spec's own file-per-concern convention makes each view owning its own topbar rendering defensible too.

### L3. `npm audit` reports 5 vulnerabilities in transitive devDependencies (already flagged, not re-litigated)
**Evidence**: work-log Group 1 notes this was found and consciously not fixed to avoid `--force`-induced breaking changes in the vite/vitest/esbuild toolchain.
**Assessment**: reasonable call for a static-site MVP with no server-side attack surface; devDependency-only vulnerabilities don't ship to production. Not re-flagging as a new finding — already surfaced and judged appropriately by the implementation itself.

---

## Requirements Alignment

Implementation matches `spec.md` closely:
- All 10 "New Components Required" files exist exactly as named/scoped.
- `AppShell.ts`'s actual responsibility (bottom tab bar + max-width variant only, no shared topbar) matches the spec's explicit "spec-audit correction" language verbatim — no scope drift, no gold-plating.
- The 20-entry starter dataset, the 12-category type/validator surface, and the content-pipeline's deferred-expansion framing are all **documented, deliberate scope decisions** per `spec.md`'s "Content Scope for This Pass" section — explicitly not flagged as issues per this review's instructions.
- No features found in the code that aren't traceable to a spec requirement (no speculative settings screens, no unused i18n scaffolding, no auth stubs, no analytics hooks).

---

## Context Consistency

- No contradictory implementations of the same functionality found, aside from the cosmetically-trivial L2 duplication above.
- No dead abstractions, no abandoned half-implemented patterns.
- One intentionally-flagged deviation exists (Card `'tile'`-variant DOM not actually mounted in Browse, Section 2 above) and is transparently documented inline and in the work-log — this is good engineering hygiene (documenting a known trade-off), not context loss.
- Consistent naming/casing conventions (PascalCase components, camelCase lib modules, kebab-case ids) applied uniformly across all 9 task groups per the work-log's own standards-reading log, and confirmed by direct file inspection.

---

## Summary Statistics

| Metric | Value |
|---|---|
| Runtime dependencies | 0 |
| Dev dependencies | 5 (vite, vitest, typescript, jsdom, @types/node) |
| Classes in `src/` | 0 |
| Config files at repo root | 1 (`vite.config.ts`) |
| Component files | 5 (Card, AppShell, BrowseGrid, FilterBar, LearnMode) |
| Lib/pure-logic files | 4 (filters, learnAlgorithm, storage, config) |
| Total `src/` LOC (non-test) | ~1,050 |
| Total tests | 43 Vitest + 2 build checks + 5 content-pipeline checks = 50 |
| Content-pipeline validation rules | 4 (shape, required fields, enums, duplicates) — all spec-traceable |
| CI/CD workflow jobs | 2 (build, deploy), single linear pipeline, zero secrets |

No "before vs after simplification" table is included because no simplification of substance is warranted — the two Low findings above (L1, L2) are optional polish, not required changes.

---

## Conclusion

**Overall status: Appropriate.**

Skill Flip's implementation matches its stated scale: a personal-project-scale static flashcard site, built with genuine vanilla-TS discipline (zero runtime dependencies, no classes, no framework-shaped abstractions), a minimal two-field variant flag on `Card`, a show/hide-only `AppShell` with no router, and content tooling sized correctly for both its current 20-entry dataset and its documented future 150-term expansion. I found no Critical, High, or Medium severity over-engineering. The three Low-severity notes (unused `AppShell.destroy()` call site, minor `renderProgressStats` duplication, already-acknowledged `npm audit` findings) are optional cleanup, not blockers, and none warrant more than about 20 minutes of work combined.

**Recommended action**: none required before merge/ship. If the team wants a small polish pass, deduplicating `renderProgressStats` (L2) is the only item with any measurable payoff, and it's cosmetic.
