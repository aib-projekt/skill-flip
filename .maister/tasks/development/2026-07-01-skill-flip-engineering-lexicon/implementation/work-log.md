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

### Group 5: Learn Mode UI
**From Implementation Plan**: PascalCase `LearnMode.ts`, camelCase lib imports — applied.
**From INDEX.md**: N/A — skipped.
**Discovered During Execution**: none beyond what was specified.

## 2026-07-01T15:12:59Z - Group 5 Complete

**Steps**: 5.1-5.6 completed. **Tests**: 6 passed, plus full-project `tsc --noEmit` clean.
**Visual Compliance**: ✓ both mockups — own topbar (exit/progress-stats/reset icons), mark-row only-when-flipped, weighted-draw advance on mark.
**Files Modified**: src/components/LearnMode.ts, LearnMode.test.ts (created); theme.css (appended).
**Notes**: Reset uses native `confirm()`. `.mark-row` visibility re-derived via event listening on `card.element` rather than a `Card.ts` callback (kept within Group 5's file scope). Exit-to-Browse button is an intentional no-op placeholder — flagged for Group 6 (AppShell) to wire the actual view-swap.

### Group 4: Browse / Filter / Search UI
**From Implementation Plan**: PascalCase `FilterBar.ts`/`BrowseGrid.ts`, camelCase lib imports, two-tier CSS naming — applied.
**From INDEX.md**: N/A — skipped.
**Discovered During Execution**: `Card.ts`'s `'tile'` variant (per Group 2's actual implementation) only suppresses the nav-row/renames classes — it does not produce the mockup's flat tile markup.

## 2026-07-01T15:12:59Z - Group 4 Complete

**Steps**: 4.1-4.5 completed. **Tests**: 6 passed, plus `tsc --noEmit` clean.
**Visual Compliance**: ✓ browse-filter-and-grid.html (topbar, filter-bar, chips, level toggle, result-count, grid breakpoints) — ⚠ one documented deviation (see Notes); ✓ browse-empty-state.html (empty state + Clear filters) fully verified.
**Files Modified**: src/components/FilterBar.ts, BrowseGrid.ts, BrowseGrid.test.ts (created); theme.css (appended, after Group 5's block, no existing rules touched).
**Notes**: **Flagged deviation**: `createCard({variant:'tile'})` is instantiated per-tile purely as a flip-state engine; its own DOM is never mounted — a hand-built flat `.tile` structure is rendered instead and kept in sync with the Card instance's state, since Card's actual tile-variant DOM doesn't match the mockup's flat markup. Documented inline in `BrowseGrid.ts`, reasonable given Card's current shape; noted as a future simplification opportunity if Card.ts ever gains a genuine flat tile-render path. No live browser check was possible yet (BrowseGrid isn't mounted into `main.ts` until Group 6) — verified via tests + textual mockup comparison only; Group 6 or Group 9 should do a live visual check once AppShell wires it in.

### Group 6: AppShell & Wiring
**From Implementation Plan**: PascalCase `AppShell.ts`, matches `element`/`getState`/`destroy` factory pattern established by Card/LearnMode/BrowseGrid.
**From INDEX.md**: N/A — skipped.
**Discovered During Execution**: none beyond what was specified.

## 2026-07-01T15:19:13Z - Group 6 Complete

**Steps**: 6.1-6.5 completed. **Tests**: 5 passed, plus full-project `tsc -b --noEmit` clean.
**Visual Compliance**: ✓ both mockups — 480px/900px width variants, bottombar/tab-btn active styling, no shared topbar, no reload/URL change on switch, Learn Mode progress survives round-trip. Verified live in a dev-server walkthrough (screenshots + console + localStorage/window.location inspection).
**Files Modified**: src/components/AppShell.ts, AppShell.test.ts (created); src/main.ts (replaced stub with real fetch→validate→mount flow); theme.css (appended, plus a non-mockup-derived minimal `.app-error` state for fetch-failure visibility).
**Notes**: Both LearnMode and BrowseGrid are mounted once and kept alive (display:none toggling), not destroyed/recreated on switch — preserves in-progress Card flip state across tab switches, not just localStorage progress. Wired `LearnMode`'s previously-no-op exit button via `querySelector` (consistent with the codebase's existing test-idiom for locating buttons by aria-label) rather than modifying `LearnMode.ts` (outside this group's file scope). **Full app is now reachable end-to-end** (`npm run dev` → Learn Mode default → Browse via tab or exit icon → back to Learn with progress intact) — manually verified live. Minor note: subagent initially looked for mockups at a mis-resolved relative path and fell back to the product-design task's copy — content is byte-identical (both copied from the same source in Phase 0), so no correctness impact; noted for future prompt-path clarity.

## 2026-07-01T15:22:15Z - Manual Browser Verification (main agent, post-Group 6)

Independently verified the live app via the preview tool (not just trusting subagent reports): Learn Mode card front (Java/Senior badges, term, progress stats 0/0/20) → flip via the real "Flip card" button → definition + "(i)" toggle revealing both translationPl and descriptionPl → "Know it" mark advances to a new card, stats correctly stay at "20 new" (graduation requires 2 consecutive marks, not 1) → Browse tab shows brand+stats topbar, all 12 category chips with live counts (Java 20, others 0), "20 of 20 terms" → search "deadlock" debounces correctly to "1 of 20 terms" → tile flip-in-place shows the definition. Zero console errors throughout. Confirms Groups 1-6's self-reported test passes translate into an actually-working, visually-faithful app, not just green checkmarks.

### Group 8: Build, Deploy & Documentation
**From spec.md**: no env vars/secrets, workflow order checkout→npm ci→validate-glossary→build→deploy — applied verbatim. README dual-audience, no filler — applied.
**Discovered During Execution**: reused `content-pipeline/validate-glossary.test.ts`'s Node-test-runner pattern for the new `scripts/verify-build.test.ts`, keeping build/config checks decoupled from Vitest's `src/**/*.test.ts` scope.

## 2026-07-01T15:24:40Z - Group 8 Complete

**Steps**: 8.1-8.6 completed. **Tests**: 2 passed (scripts/verify-build.test.ts via node:test), plus a non-required full `npm test` sanity pass (37 Vitest + 2 build checks, all green).
**Files Modified**: scripts/verify-build.test.ts, .github/workflows/deploy.yml, LICENSE, README.md (all created); package.json (added test:build script, composed into npm test).
**Notes**: Deploy workflow uses GitHub's native `actions/deploy-pages` (OIDC-based, zero secrets/PATs) rather than a gh-pages-branch push. **Flag for user**: first real push to `main` will require enabling "GitHub Actions" as the Pages source under repo Settings → Pages (one-time; no git remote is configured yet in this sandbox — confirmed via `git remote -v`). All 8 implementation task groups' Success Criteria are now met.

### Group 9: Test Review & Gap Analysis
**From Implementation Plan**: no `.maister/docs/standards/` or INDEX.md — skipped.
**Discovered During Execution**: corrected pre-existing test-count estimate (44, not 41, since Group 8's 2 build checks were previously uncounted); found "full-mastery fallback" gap candidate already covered (no padding added).

## 2026-07-01T15:30:33Z - Group 9 Complete

**Steps**: 9.1-9.4 completed. **Tests added**: 6 (within the 10-test cap) — Card `variant='tile'` isolated coverage, BrowseGrid 0-count category chip + own-topbar progress-stats assertion, `main.ts` bootstrap error-state coverage (3 tests: fetch rejects, fetch not-ok, empty-array glossary).
**Grand total**: 43 Vitest + 2 build checks + 5 content-pipeline checks = 50 tests/checks, all passing. Full-project `tsc -b --noEmit` clean.
**Files Modified**: src/components/Card.test.ts, BrowseGrid.test.ts (both modified, tests appended); src/main.test.ts (created).
**Success-Criteria Traceability**: all 10 spec.md Success Criteria bullets traced to specific passing tests, except 2 (README completeness, .gitignore/git correctness) which are documentation/config-existence facts traced to Group 1/8's work-log notes instead — appropriate, not a gap. The live GitHub Pages deploy (part of bullet 8) remains a documented, correctly-deferred manual step pending the first real push (no git remote configured in this sandbox).
**Notes**: `content-pipeline/validate-glossary.test.ts`'s 5 tests are NOT wired into `npm test` or CI (deliberate Group 7 decoupling decision) — the deploy workflow runs the actual `validate-glossary` script as a build gate, which matters more than its own unit tests running in CI, so this is left as-is.

## 2026-07-01T15:30:33Z - Implementation Complete

**Total Steps**: 52 completed across 9 task groups (all checkboxes in implementation-plan.md verified zero remaining `[ ]`)
**Total Standards**: no project-specific standards existed (`.maister/docs/` absent throughout) — conventions applied from spec.md/implementation-plan.md's Implementation Guidance sections (PascalCase components, camelCase lib modules, two-tier CSS custom-property naming, kebab-case id slugs), confirmed consistently applied across all 9 groups
**Test Suite**: 43 Vitest tests + 2 build checks (via `npm test`) + 5 content-pipeline checks (via standalone `node:test`) = 50 total, all passing. `npx tsc -b --noEmit` clean. `npm run validate-glossary` passes with zero errors against the real 20-entry starter dataset. Independently re-run and confirmed by main agent (not just trusting subagent reports).
**Manual verification**: main agent independently drove the live app in a browser (2026-07-01T15:22:15Z entry above) — Learn Mode flip/translation-toggle/marking, Browse search/filter/tile-flip, AppShell view-switching all confirmed working, zero console errors.
**Known deferred items**: full ~150-term/12-category content authoring (explicitly out of this pass's scope, documented pipeline exists for the follow-up); live GitHub Pages deploy confirmation (requires enabling GitHub Actions as Pages source + a real push, no git remote configured in this sandbox); `npm audit` reports 5 vulnerabilities in transitive devDependencies (flagged by Group 1, not addressed — typical for the vite/vitest/esbuild toolchain, `--force` fix risks breaking changes).

## 2026-07-01T15:48:54Z - Phase 11 Verification Fixes Applied

Verification (completeness, code review, pragmatic review, production readiness, reality check) all passed/GO except code review's 1 Critical finding. Fixed all 4 user-approved fixable items:
1. **Critical (security)**: `src/components/Card.ts:207` — replaced `innerHTML` template-string interpolation of `entry.translationPl` with DOM-API node construction (`document.createTextNode` + `<strong>` + `textContent`). Eliminates the one injection-sink exception to the codebase's otherwise-consistent `textContent`-only pattern.
2. **Info (cosmetic)**: removed the redundant inline `translationPop.style.display` toggle in `Card.ts`, consolidating visibility control into the existing `.is-visible` CSS class — added the corresponding `display: none` / `.is-visible { display: block }` rule pair to `theme.css`.
3. **Warning (duplication)**: exported `categoryBadgeClass` from `Card.ts`; `BrowseGrid.ts`'s `createTile()` now imports and reuses it instead of duplicating the category-slug regex transform inline.
4. **Warning (duplication)**: extracted `renderProgressStats(container, entries)` into a new shared module `src/components/progressStats.ts`; both `BrowseGrid.ts` and `LearnMode.ts` now call the shared function instead of each maintaining a near-identical local copy.
5. **Info (dev-only hardening)**: added a path-containment guard to `vite.config.ts`'s `serveRootData` dev-server middleware — requests resolving outside `data/` (e.g. via `..` traversal) now get a 403 instead of being rewritten to an arbitrary `@fs` filesystem path.

**Re-verification**: full suite re-run after fixes — 43 Vitest tests + 2 build checks + 5 content-pipeline checks, all passing (zero regressions); `npx tsc -b --noEmit` clean. Manually re-verified live in browser on a fresh dev-server instance: flip, "(i)" translation toggle (now DOM-API-built, confirmed `<strong>` element present via accessibility tree), Browse tab, category badges (via the shared helper), tile flip — all correct, zero console errors.

**Not fixed** (per user's "fix all fixable" scope — these were assessed as not genuinely fixable or not worth the churn): `LearnMode.ts`'s generic click/keydown listening to re-derive Card's flip state (architectural, works, tested); `npm audit` vulnerabilities being tracked only in this work-log rather than a durable tracker (process note, not a code issue).
