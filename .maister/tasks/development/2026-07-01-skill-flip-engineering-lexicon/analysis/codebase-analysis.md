# Codebase Analysis Report

**Date**: 2026-07-01
**Task**: Implement the Skill Flip engineering lexicon flashcard app
**Description**: Implement the Skill Flip engineering lexicon flashcard app (Vite + vanilla TypeScript, client-only static site, glossary data model, flip-card learn mode, browse/filter/search, GitHub Pages deployment) — a greenfield build from an approved product-design brief.
**Analyzer**: codebase-analyzer skill (1 Explore agent: File Discovery + Code Analysis, combined Feature-type)

---

## TL;DR

The project root is a true greenfield: no source code, no package manifests, not even a git repository. All that exists is Maister tooling (`.claude/`, `.idea/`, `.maister/`) and a complete, implementation-ready product-design brief with an 8-section feature spec and 4 reviewed mockups. There is nothing to integrate with or migrate — this is a from-scratch scaffold-and-build task, fully unblocked by design ambiguity. The feature spec (`analysis/feature-spec.md`, 356 lines) already prescribes the exact repo layout, `GlossaryEntry` schema, filter/search logic, and the weighted-random learn algorithm in near-implementation-ready pseudocode, which materially de-risks the build.

## Key Decisions

- Follow the repo structure specified verbatim in feature-spec.md Section 7 (`src/types`, `src/components`, `src/lib`, `src/styles`, `content-pipeline/`, `data/glossary.json`) rather than inventing a new layout — the spec was already validated against mockups and is implementation-ready.
- Build the single shared `Card` component first (Section 2) since both Learn Mode and Browse/Filter/Search grid depend on it — it is the highest-leverage, most-reused piece of the app.
- Initialize git for the first time as part of this build; there is no existing history, branch, or remote to reconcile with.
- Treat `content-pipeline/` as fully decoupled tooling (its own scripts, not imported by `src/`) per the spec's explicit boundary — do not let content-authoring code leak into the runtime bundle.

## Open Questions / Risks

- ~150-term glossary content (`data/glossary.json`) does not exist yet and must be authored (via the documented AI-assisted pipeline + creator review) before Learn Mode or Browse features are meaningfully testable end-to-end; app logic can be built against a small hand-written fixture set in the meantime.
- Per-category badge-color mapping, the 100%-mastery celebratory state, and the README license choice are explicitly left as implementation-time details in the brief — pick reasonable defaults rather than blocking on them.
- No testing framework, linter, or CI config exists yet — these need to be selected/scaffolded as part of setup since the spec does not prescribe a specific test runner.
- The 4 HTML mockups are static/interactive prototypes, not source code — useful as visual/behavioral reference but not reusable as-is (no build tooling, no TypeScript, likely inline styles/scripts).

---

## Summary

The working directory contains zero application code and is not yet a git repository — this is a pure greenfield build. However, the design phase is fully complete: a product brief, an 8-section implementation-ready feature specification, alternatives/decisions records, and 4 interactive HTML mockups are checked in under `.maister/tasks/`. These artifacts specify the exact data schema, component architecture, algorithms, visual theme, and deployment pipeline needed, meaning the implementation phase can proceed directly to scaffolding without further requirements discovery.

---

## Files Identified

### Primary Files (Design Artifacts — Reference/Input, Not Source Code)

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/outputs/product-brief.md`** (117 lines)
- Canonical product brief: TL;DR, key decisions, open questions/risks, problem statement, personas, feature overview, constraints, success criteria, acceptance criteria.
- The top-level entry point for understanding scope; links out to all other analysis documents.

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/feature-spec.md`** (356 lines)
- The implementation-ready specification, in 8 sections: (1) Data Model & Content Schema, (2) Card & Flip Interaction, (3) Browse/Filter/Search, (4) Learn Mode algorithm, (5) Visual Design & Theming, (6) Content Generation Pipeline, (7) Project Structure/Build/Deployment, (8) Documentation/README.
- Contains near-final TypeScript interfaces (`GlossaryEntry`, `CardViewState`, `BrowseFilterState`, `LearnProgressEntry`), a working `applyFilters` pure function, the exact weighted-draw algorithm and bucket-weight constants, the full CSS custom-property palette, and the exact target directory tree. This is the primary blueprint for implementation.

**`.maister/tasks/development/2026-07-01-skill-flip-engineering-lexicon/analysis/design-context/brief.md`** (117 lines)
- Cross-linked copy of the product brief, staged into the development task folder for this workflow's consumption.

### Related Files (Design Artifacts — Supporting Reference)

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/design-decisions.md`**
- Rationale for the 4 key decision areas (tech stack, learn algorithm, interaction model, content pipeline) with trade-offs against rejected alternatives.

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/alternatives.md`**
- 14 alternatives considered across 4 decision areas — useful if an implementation detail seems to conflict with the spec and the underlying reasoning needs to be checked.

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/personas.md`**
- Full persona cards and user journeys (Creator/Learner, Recruiter/Visitor) — useful for UX judgment calls not explicitly covered by the spec.

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/problem-statement.md`**
- Full problem statement, constraints, and success criteria detail (condensed version is in the brief).

**`.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/context/Engineering Ladder.md`**
- The raw source taxonomy (~150 skill bullets across 12 categories) that the glossary content pipeline will curate from. Needed for content authoring, not app-logic implementation.

**`.maister/tasks/*/analysis/mockups/` (4 HTML files, present in both product-design and development task folders)**
- `learn-mode-card-front.html`, `learn-mode-card-back-flipped.html`, `browse-filter-and-grid.html`, `browse-empty-state.html`
- Interactive visual prototypes reviewed during design; useful as a pixel/behavior reference for the Card component and Browse grid, but built as standalone HTML (not part of the Vite/TS app structure) and not intended to be imported or reused as source.

**`.idea/.gitignore`**
- Pre-existing IntelliJ-standard gitignore rules; should be merged into (not overwritten by) the new root `.gitignore`.

---

## Current Functionality

There is no current functionality — the repository has no `src/`, no `index.html`, no build config, and is not under version control. "Current state" is entirely the design/planning artifacts described above.

### Key Components/Functions (As Specified — To Be Built)

- **`GlossaryEntry` / `Glossary` types** (`src/types/glossary.ts` per spec): the core data model — `id`, `term`, `description`, `translationPl`, `descriptionPl`, `category` (12-value enum), `level` (Junior/Regular/Senior).
- **`Card` component** (`src/components/Card.ts`): shared flip/navigation/swipe component used by both Learn Mode and Browse grid tiles; front shows term + badges, back shows description + a separate "(i)" toggle for Polish translation.
- **`applyFilters` function** (`src/lib/filters.ts`): pure function combining category filter, level filter, and substring search across term/description/translationPl/descriptionPl.
- **Weighted-draw learn algorithm** (`src/lib/learnAlgorithm.ts`): builds a weighted pool from bucket state (`dont_know`=4, `unseen`=2, `know`=1), draws uniformly at random, excludes the immediately-previous card, and updates `consecutiveKnowCount`/bucket on each mark.
- **`storage.ts`**: localStorage read/write helpers, keyed as `skillflip:learn-progress`.
- **`validate-glossary.ts`** (in `content-pipeline/`, separate tooling, not part of the app bundle): schema validator run via `npm run validate-glossary`.

### Data Flow (As Specified)

1. App fetches `data/glossary.json` once at load (not bundled into JS — editable without rebuild), validates it's a non-empty array, holds it in memory.
2. Browse/Filter/Search: `BrowseFilterState` (search query, selected categories, selected level) is run through `applyFilters` on every state change (search debounced 200ms) to produce a filtered subset rendered as a flippable tile grid.
3. Learn Mode: per-card `LearnProgressEntry` records persisted in `localStorage`, keyed by `id`; each "Next" re-runs the weighted draw against current bucket state to pick the next card; marking "know"/"don't know" updates the bucket and consecutive-count, persisted immediately (not just on exit).
4. Both Browse and Learn Mode hand an ordered queue of `GlossaryEntry` + index to the same shared `Card` component — this is the "one component, two queue-construction strategies" architecture.

---

## Dependencies

### Imports (What This Depends On)

Nothing yet exists to import from. Anticipated stack per the spec: Vite (build tool/dev server), vanilla TypeScript (no framework), no runtime dependencies beyond what's needed for JSON schema validation in the content-pipeline tooling (a "small hand-written validator or lightweight schema library" — unspecified, implementation's choice).

### Consumers (What Depends On This)

None — greenfield, no existing consumers anywhere in or outside this repository.

**Consumer Count**: 0
**Impact Scope**: None — no existing system to break. All risk is forward-looking (build-quality risk, not integration risk).

---

## Test Coverage

### Test Files

None exist. No test framework is configured or specified in the brief/spec.

### Coverage Assessment

- **Test count**: 0
- **Gaps**: Everything — test framework selection (e.g. Vitest, which pairs naturally with Vite) is an implementation-time decision not covered by the design brief. The spec's acceptance criteria (schema validation passes, flip works via tap/keyboard/screen-reader, search/filter combine correctly, weighted draw demonstrably favors `dont_know`, deploy pipeline works end-to-end, README completeness) read as a natural checklist for unit + manual/E2E test coverage once code exists.

---

## Coding Patterns

### Naming Conventions (As Specified)

- **Types/Interfaces**: PascalCase (`GlossaryEntry`, `CardViewState`, `BrowseFilterState`, `LearnProgressEntry`, `Bucket`, `Level`, `Category`).
- **Files**: PascalCase for components (`Card.ts`, `BrowseGrid.ts`, `FilterBar.ts`, `LearnMode.ts`), camelCase for lib/utility modules (`filters.ts`, `learnAlgorithm.ts`, `storage.ts`).
- **IDs**: lowercase-kebab-case slugs for `GlossaryEntry.id` (e.g. `"idempotency"`), stable across edits since they double as the localStorage progress key.
- **CSS custom properties**: `--color-*` for raw palette values, `--bg-*` / `--text-*` / `--accent-*` for semantic mappings — a two-tier variable naming convention (raw color → semantic alias).

### Architecture Patterns (As Specified)

- **Style**: Vanilla TypeScript, component-based but framework-free — components are likely classes or factory functions wrapping DOM manipulation directly (no JSX/virtual DOM), given "no framework" is an explicit constraint.
- **State Management**: Local/in-memory for filter state and card-view state; `localStorage` for cross-session Learn Mode progress only. No global store, no framework-managed reactivity — state changes are expected to trigger manual re-render calls.
- **Data loading**: Runtime `fetch()` of a static JSON file rather than build-time bundling, explicitly to allow content edits without a rebuild.
- **Separation of concerns**: `content-pipeline/` (content authoring tooling) is explicitly walled off from `src/` (runtime app) — no imports cross that boundary.

---

## Complexity Assessment

| Factor | Value | Level |
|--------|-------|-------|
| File count (to be created) | ~15-20 source files per spec's Section 7 tree | Medium |
| Dependencies | Vite + TypeScript only (no framework, minimal deps) | Low |
| Consumers | 0 (greenfield, no existing integration surface) | Low |
| Test coverage | 0 existing; framework unselected | High (gap, not yet a defect) |
| Design/requirements ambiguity | Fully specified across 8 sections, 4 mockups, explicit acceptance criteria | Low |

### Overall: Moderate

The application itself is scoped as intentionally simple (no framework, no backend, ~150 static entries, localStorage-only persistence) — the brief explicitly rejected heavier alternatives (full SRS algorithm, framework adoption) to keep it proportionate. Complexity comes from breadth (three feature areas: data model, two UI modes sharing one component, content pipeline, plus deployment) rather than depth in any single area. Requirements risk is low since the spec is unusually detailed and pre-validated against mockups; execution risk is the main factor, centered on getting the shared `Card` component's dual-use (Learn Mode vs. grid-tile) abstraction right early, since both feature areas depend on it.

---

## Key Findings

### Strengths
- Feature spec is exceptionally detailed and implementation-ready: exact TypeScript interfaces, a working filter function, the precise weighted-draw algorithm with tunable constants, and the exact target file tree are all already written — this significantly reduces design-phase ambiguity during implementation.
- Clear architectural decision (shared `Card` component for both Learn Mode and Browse grid) reduces future duplication risk if respected from the start.
- Explicit separation between runtime app (`src/`) and content-authoring tooling (`content-pipeline/`) prevents scope bleed between "how the app runs" and "how content is authored."
- Deployment path (GitHub Actions to GitHub Pages, fully static, no secrets) is simple and low-risk.

### Concerns
- No `data/glossary.json` content exists yet; ~150 terms must be authored via the AI-assisted pipeline and creator review — the brief itself flags this as a larger effort than the app build.
- No test framework, linter, or CI config decided yet — needs to be selected during scaffolding since the spec doesn't prescribe one.
- No git repository yet — needs `git init` plus a merged `.gitignore` (root scaffold + existing `.idea/.gitignore`) before any commits.
- A few implementation-time details are explicitly left open in the brief (per-category badge colors, 100%-mastery celebratory state, README license) — reasonable defaults should be chosen rather than treated as blockers.

### Opportunities
- Because the spec already contains a working `applyFilters` pure function and the exact weighted-draw algorithm pseudocode, these can likely be transcribed almost directly into `src/lib/filters.ts` and `src/lib/learnAlgorithm.ts` with minimal adaptation, saving design-in-code time.
- The 4 mockups provide concrete visual/interaction reference (flip animation feel, empty-state copy, badge layout) that can shortcut CSS/UX decisions during the Card and Browse-grid build.
- A small hand-authored fixture set of glossary entries (5-10 terms) could unblock UI/algorithm implementation and testing in parallel with the larger content-authoring effort.

---

## Impact Assessment

- **Primary changes**: Full scaffold from scratch — `package.json`, `tsconfig.json`, `vite.config.ts`, root `.gitignore`, `index.html`, and the entire `src/` tree (`types/`, `components/`, `lib/`, `styles/`), `data/glossary.json`, `content-pipeline/`, `.github/workflows/deploy.yml`, `README.md`.
- **Related changes**: Initialize git repository; merge `.idea/.gitignore` rules into the new root `.gitignore`; preserve `.claude/` and `.maister/` directories untouched.
- **Test updates**: N/A (no existing tests) — new test framework and initial test suite to be established as part of implementation, ideally test-first per the spec's acceptance criteria.

### Risk Level: Low-Medium

No existing code or consumers means zero regression risk. Risk is entirely forward-looking: getting the shared `Card` component's dual-mode abstraction right, correctly implementing the weighted-draw algorithm's edge cases (exclude-previous, graduation/demotion, full-mastery uniform-random fallback), and not over-scoping beyond the explicitly-deferred implementation details (badge colors, celebratory state, license).

---

## Recommendations

Since this is a new-capability (greenfield) build with a complete specification, the recommended approach is:

**Recommended architecture**: Follow feature-spec.md Section 7's directory tree exactly — it has already been designed with the shared-component and pipeline/runtime separation in mind. Do not introduce a framework or state-management library; the spec explicitly scoped those out as over-engineering for this size of app.

**Suggested build sequence**:
1. Scaffold tooling first: `git init`, merge `.gitignore`, `package.json` + Vite + TypeScript config, minimal `index.html`.
2. Define `src/types/glossary.ts` (the `GlossaryEntry`/`Category`/`Level` types) — this underpins everything else.
3. Build a small hand-authored fixture `data/glossary.json` (5-10 entries covering a few categories/levels) to unblock feature work before full content authoring completes.
4. Build the shared `Card` component (Section 2) in isolation first, since both Learn Mode and Browse depend on it — verify flip/keyboard/swipe/accessibility behavior against the mockups early.
5. Build Browse/Filter/Search (`filters.ts` + `FilterBar.ts` + `BrowseGrid.ts`) — the `applyFilters` function from the spec can be transcribed near-verbatim.
6. Build Learn Mode (`learnAlgorithm.ts` + `storage.ts` + `LearnMode.ts`) — implement the weighted-draw and bucket-transition logic as unit-testable pure functions separate from DOM code, given the algorithm's precision requirements (acceptance criteria explicitly call out "weighted draw demonstrably favors dont_know").
7. Apply visual theming (Section 5 CSS custom properties) once functional behavior is verified.
8. Set up `content-pipeline/` tooling and begin/continue full glossary content authoring in parallel (independent of app code).
9. Wire up `.github/workflows/deploy.yml` and verify a live GitHub Pages deploy end-to-end.
10. Write the dual-audience README last, once features and deploy are confirmed working.

**Testing strategy**: Given no test framework is specified, Vitest is a natural fit (same tooling family as Vite, zero extra config for TS). Prioritize unit tests for the pure/stateless logic (`applyFilters`, the weighted-draw algorithm, bucket-transition rules) since these have explicit, checkable acceptance criteria in the brief; use manual/exploratory verification for flip/swipe/keyboard interaction and visual theming, where the mockups serve as the reference oracle.

**Backward compatibility**: Not applicable — no existing system, users, or data to preserve compatibility with.

---

## Next Steps

Proceed to gap analysis to formally enumerate the delta between "nothing exists" and the fully-specified target state, using this report and the feature-spec.md as the desired-state reference — though given the spec's completeness, the gap analysis is expected to be largely a restatement of the build sequence above rather than uncovering new requirements. From there, proceed to specification/planning phases to sequence the implementation plan (task groups: scaffolding, data model, Card component, Browse/Filter/Search, Learn Mode, theming, content pipeline, deployment, documentation) before implementation begins.
