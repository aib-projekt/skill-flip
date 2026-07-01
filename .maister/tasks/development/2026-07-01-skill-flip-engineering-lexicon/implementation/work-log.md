# Work Log

## 2026-07-01T14:34:16Z - Implementation Started

**Total Steps**: 52
**Task Groups**: 1 (Scaffolding/Git/Data Model), 2 (Card Component), 3 (Filters/Learn Algorithm/Storage), 4 (Browse/Filter/Search UI), 5 (Learn Mode UI), 6 (AppShell & Wiring), 7 (Content Pipeline & Starter Content), 8 (Build/Deploy/Docs), 9 (Test Review & Gap Analysis)

**Execution mode**: parallel wave dispatch (no `--sequential`). Waves: [1] solo; [2,3,7] parallel; [4,5] parallel; [6]; [8]; [9].

**Note**: `.maister/docs/INDEX.md` does not exist in this project (confirmed absent) — no project-specific standards directory to discover from. Conventions instead come from `implementation/spec.md`'s Implementation Guidance section and `implementation-plan.md`'s Standards Compliance section (PascalCase types/components, camelCase lib modules, kebab-case entry IDs, two-tier CSS custom-property naming).

## Standards Reading Log

### Group 1: Scaffolding, Git & Data Model
**From Implementation Plan**:
- camelCase for lib/utility modules — applied to `src/lib/config.ts`
- lowercase-kebab-case for `GlossaryEntry.id` slugs — applied in fixture data
- Two-tier CSS custom-property naming — applied verbatim in `theme.css`

**From INDEX.md**: N/A — no `.maister/docs/INDEX.md` exists, skipped.

**Discovered During Execution**:
- `import.meta.env.BASE_URL`-relative fetch pattern (not hardcoded `/skill-flip/`) — required so `data/glossary.json` resolves correctly under both dev and built base paths; established as the convention for Groups 2-6 whenever a base-path reference is needed.
- Custom `serveRootData` Vite plugin — serves `data/glossary.json` from repo root (not `public/`) in dev and copies it into `dist/data/` on build, keeping one canonical file path for both the browser fetch and Group 7's Node-based validator.
- `@types/node` + `src/vite-env.d.ts` — needed to satisfy `tsc -b --strict` for Node builtins in `vite.config.ts` and `import.meta.env` typing.

## 2026-07-01T14:49:18Z - Group 1 Complete

**Steps**: 1.1 through 1.9 completed
**Standards Applied**: see Standards Reading Log above
**Tests**: 3 passed (glossary.test.ts) — ran in isolation, not full suite
**Files Modified**: package.json, package-lock.json, tsconfig.json, vite.config.ts, .gitignore, index.html, src/main.ts, src/types/glossary.ts, src/types/glossary.test.ts, src/lib/config.ts, src/styles/theme.css, src/vite-env.d.ts, data/glossary.json
**Notes**: `npm run dev` and `npm run build` both verified end-to-end (screenshot + console logs), zero console errors. `npm audit` reports 5 vulnerabilities (3 moderate, 1 high, 1 critical) in transitive devDependencies — typical for the vite/vitest/esbuild toolchain, not addressed (out of scope, `--force` fix risks breaking changes), flagged for awareness. Working tree committed by user request as `158fa78`.

### Group 2: Card Component
**From Implementation Plan**:
- PascalCase component file naming — `Card.ts`, `Card.test.ts`
- Two-tier CSS custom-property naming — new rules reference existing `--bg-*`/`--text-*`/`--color-*` tokens, no new hardcoded hex values

**From INDEX.md**: N/A — no INDEX.md exists, skipped.

**Discovered During Execution**: none beyond what plan/spec already specified.

## 2026-07-01T14:59:16Z - Group 2 Complete

**Steps**: 2.1 through 2.8 completed
**Standards Applied**: see Standards Reading Log above
**Tests**: 6 passed (Card.test.ts) — ran in isolation
**Visual Compliance**: ✓ both mockups (learn-mode-card-front.html, learn-mode-card-back-flipped.html) — flip mechanics, badge/term layout, "(i)" toggle revealing translationPl+descriptionPl together, back face growing with content all confirmed via screenshot comparison against a temporary (fully reverted) dev-server harness
**Files Modified**: src/components/Card.ts (created), src/components/Card.test.ts (created), src/styles/theme.css (appended)
**Notes**: Documented deviation — flip implemented via visibility/position swap gated by a `.card-shell-back` modifier class rather than a literal 3D `rotateY` transform, since a pure CSS rotation can't simultaneously keep both faces in the DOM (`backface-visibility:hidden`, never `display:none`) AND let the back face grow with content (`min-height`, not fixed aspect-ratio). Screenshots confirm pixel-match against both mockups regardless. `variant: 'tile'` currently only suppresses nav-row/renames classes — Browse (Group 4) expected to handle grid-specific sizing itself. Only 2 of 12 category badge colors exist in theme.css so far (per known, already-flagged risk) — Group 4/5 will need to extrapolate the rest.

### Group 3: Filters, Learn Algorithm & Storage
**From Implementation Plan**: camelCase lib/utility naming — `filters.ts`, `learnAlgorithm.ts`, `storage.ts`.
**From INDEX.md**: N/A — no INDEX.md exists, skipped.
**Discovered During Execution**: reused `feature-spec.md`'s literal `applyFilters` TypeScript source and Section 4 draw-algorithm prose closely, per the plan's "follow feature-spec.md verbatim" decision.

## 2026-07-01T15:02:10Z - Group 3 Complete

**Steps**: 3.1 through 3.6 completed
**Tests**: 11 passed (filters.test.ts, learnAlgorithm.test.ts, storage.test.ts) — ran in isolation
**Files Modified**: src/lib/filters.ts, filters.test.ts, learnAlgorithm.ts, learnAlgorithm.test.ts, storage.ts, storage.test.ts (all created)
**Notes**: `BrowseFilterState` type lives in `filters.ts`; `Bucket`/`LearnProgressEntry`/`ProgressMap` types live in `storage.ts` (both outside `glossary.ts`, which only holds `GlossaryEntry`/`Category`/`Level`/`Glossary` per Group 1). `computeBucketCounts` is the single shared function Groups 4/5 must both call, satisfying spec-audit Finding 2/4. **Environment fix applied by main agent** (not part of Group 3's declared scope): Node 26's experimental global `webstorage` was shadowing jsdom's `window.localStorage` in vitest, causing `undefined` inside test files. Root-caused and worked around locally in `storage.test.ts` by the subagent; main agent then applied a permanent fix at `vitest.setup.ts` (new file) + `vite.config.ts`'s `test.setupFiles`, verified all 17 existing tests (filters/storage/learnAlgorithm/Card) still pass. Groups 4/5 should not need to repeat this workaround.

### Group 7: Content Pipeline & Starter Content
**From Implementation Plan**: hand-written validator, no schema library, devDependency-only, zero imports into `src/` — followed exactly.
**From INDEX.md**: N/A — no INDEX.md exists, skipped.
**Discovered During Execution**: `content-pipeline/` tests run via Node's native `node:test` runner rather than Vitest, since Vitest's `include` glob is scoped to `src/**/*.test.ts` (owned by other groups) — this is a stronger form of the spec's own "fully decoupled from src/" requirement, not a workaround.

## 2026-07-01T15:03:26Z - Group 7 Complete

**Steps**: 7.1 through 7.7 completed
**Tests**: 5 passed (validate-glossary.test.ts via node:test) — ran in isolation
**Files Modified**: content-pipeline/validate-glossary.ts, validate-glossary.test.ts, prompt-template.md, rubric.md, source/engineering-ladder.md (all created); data/glossary.json (replaced 3-entry stub with 20 real Java entries — 11 Regular, 9 Senior); package.json (appended validate-glossary script only)
**Notes**: `npm run validate-glossary` passes with zero errors against the real 20-entry dataset. Fixed a path-encoding bug in the CLI's direct-execution guard (repo path contains a space) using `pathToFileURL` instead of manual string comparison. Merged an initial 21st entry (over-split compound bullet) back into `java-memory-management` to land at 20 entries, per the rubric's own "don't over-split" guidance.

### Loaded Per Group
(Entries added as groups execute)
