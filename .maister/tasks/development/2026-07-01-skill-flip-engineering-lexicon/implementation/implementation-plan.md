# Implementation Plan: Skill Flip — Engineering Lexicon

## TL;DR
9 task groups, ~52 steps total. Execution order: Group 1 (scaffold/types/git) unblocks everything; Groups 2 (Card), 3 (pure lib logic), and 7 (content pipeline + starter data) then run in parallel; Groups 4 (Browse UI) and 5 (Learn Mode UI) each depend on 2+3 and can run in parallel with each other; Group 6 (AppShell wiring) depends on 4+5; Group 8 (build/deploy/docs) depends on 6+7; Group 9 (test review) closes it out. Theming is folded into each UI group (mockup CSS is copied near-verbatim, not a separate research task) rather than a standalone pass.

## Key Decisions
- Theming is NOT a standalone task group — `src/styles/theme.css`'s palette/tokens are written once in Group 1 (needed by every component immediately) and each UI group (2, 4, 5, 6) adds only the component-scoped rules it needs, copied from the mockups' inline `<style>` blocks. Splitting theming into its own late-sequence group would force a rework pass across already-built components.
- Filters (`applyFilters`), the learn algorithm, and `storage.ts` are grouped together (Group 3) because they are pure/stateless logic with no DOM dependency, share `src/types/glossary.ts`, and are independently unit-testable in isolation from both UI groups that consume them.
- Content pipeline + starter content authoring is one group (Group 7), not two — the validator and the ~15-20 term dataset are developed together so the dataset is validated as it's written, and the group has zero dependency on Card/Browse/LearnMode, so it runs fully in parallel with UI work.
- AppShell (Group 6) is scheduled after Browse (Group 4) and Learn Mode (Group 5) rather than before, because AppShell's job is to mount/toggle two already-built view containers — building it first would mean stubbing both views, then rewiring, which is wasted motion.
- Per the spec-audit fix, Group 4 and Group 5 each own and render their own topbar (both including `component:progress-stats`, computed via the same shared `storage.ts` function from Group 3) — AppShell in Group 6 owns only the bottom tab bar and the two `.app-shell` width variants (480px / 900px "wide"), never a shared topbar component.

## Open Questions / Risks
- The shared `Card` component (Group 2) is consumed by two different call sites (Learn Mode single-card flow, Browse grid-tile flow) with different sizing/interaction subsets (grid tiles don't get swipe-to-mark or Prev/Next). If Group 2's public interface doesn't cleanly support "tile mode" (collapsed, flip-in-place, no nav row), Groups 4 and 5 will both need rework — build and manually verify Card in isolation against both mockup screens (front + flipped-back) before starting Group 4/5.
- Per-category badge-color mapping has mockup precedent for only 2 of 12 categories (`cat-api`, `cat-java`, `cat-data` seen across mockups — 3 total, not 12). Group 4/5 implementers must extrapolate a consistent, accessible-contrast scheme for the remaining categories; since this pass only ships Java-category data, only 1 category chip actually renders content, but all 12 chip labels/counts must still be structurally correct (0-counts for the other 11).
- `content-pipeline/`'s schema validator (Group 7) has no prescribed library — a small hand-written validator (no new runtime dependency) is assumed; if an implementer reaches for a schema library instead, confirm it stays devDependency-only and never imports into `src/`.

## Overview
Total Steps: 52
Task Groups: 9
Expected Tests: 34-58 (see per-group ranges; Group 9 adds up to 10 more on top of prior groups' totals)

## Implementation Steps

### Task Group 1: Scaffolding, Git & Data Model
**Dependencies:** None
**Files to Modify:** `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` (or vite.config.ts test block), `.gitignore`, `index.html`, `src/main.ts`, `src/types/glossary.ts`, `src/lib/config.ts`, `src/styles/theme.css`, `data/glossary.json` (fixture stub), `src/types/glossary.test.ts`

- [ ] 1.0 Complete scaffolding, git initialization, and core data model
  - [ ] 1.1 Write 3 focused tests for the data model / fixture loading contract:
    - `GlossaryEntry` shape accepts all required fields (`id`, `term`, `description`, `translationPl`, `descriptionPl`, `category`, `level`)
    - a fixture array of 3+ entries type-checks against `Glossary`
    - `Category` enum includes exactly the 12 taxonomy values (Java, Spring/JEE, Data Storage, DevOps, Cloud Engineering, Testing, Soft Skills, + remaining 5 per `Engineering Ladder.md` taxonomy) and `Level` includes exactly Junior/Regular/Senior
  - [ ] 1.2 Run `git init`; merge existing `.idea/.gitignore` rules (`/shelf/`, `/workspace.xml`, `/httpRequests/`, `/queries/`, `/dataSources/`, `/dataSources.local.xml`) into a new root `.gitignore` alongside standard Node/Vite ignores (`node_modules/`, `dist/`, `.env*`, editor files); explicitly verify `.claude/` and `.maister/` are NOT added to any ignore rule (must remain tracked/visible)
  - [ ] 1.3 Scaffold `package.json` (npm), `tsconfig.json` (strict mode), `vite.config.ts` with `base: '/skill-flip/'`, and Vitest wired via `npm test` / `npm run test`
  - [ ] 1.4 Create minimal `index.html` entry point (mounts `#app`, loads `src/main.ts` as module) and stub `src/main.ts` (fetches `data/glossary.json`, logs count — real `AppShell` mount comes in Group 6)
  - [ ] 1.5 Write `src/types/glossary.ts`: `GlossaryEntry`, `Category` (12-value union/enum), `Level` (`Junior`|`Regular`|`Senior`), `Glossary` (`GlossaryEntry[]`) types
  - [ ] 1.6 Write `src/lib/config.ts`: `BUCKET_WEIGHTS = { dont_know: 4, unseen: 2, know: 1 }`, `GRADUATION_THRESHOLD = 2`
  - [ ] 1.7 Seed `src/styles/theme.css` with the CSS custom-property palette copied verbatim from the mockups' `:root` block (`--color-navy:#1c2b3a`, `--color-steel:#5b7086`, `--color-ice:#d7e2e6`, `--color-sage:#6f8a72`, `--color-chartreuse:#e3e8ad`, `--color-cream:#f7f7f2`, `--accent-dont-know:#b5765f`) plus the two-tier semantic aliases (`--bg-*`, `--text-*`, `--accent-*`), base `body`/font-family rules, and a `@media (prefers-reduced-motion: reduce)` block disabling flip/transition animations
  - [ ] 1.8 Create a 3-entry `data/glossary.json` fixture stub (placeholder Java terms) so `fetch()` has something to load during Groups 2-6; replaced with the real ~15-20 term set in Group 7
  - [ ] 1.9 Ensure scaffolding tests pass
    - Run ONLY the 3 tests written in 1.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 3 tests pass
- `npm run dev` serves the stub app without console errors; `npm run build` succeeds against the stub
- Git repo exists with a merged `.gitignore`; `.claude/` and `.maister/` are untouched/tracked (Success Criteria: "Site is git-initialized with a merged `.gitignore`... `.claude/` and `.maister/` left untouched")
- `Category` enum carries all 12 taxonomy values even though only Java has data this pass

---

### Task Group 2: Card Component
**Dependencies:** Group 1
**Files to Modify:** `src/components/Card.ts`, `src/components/Card.test.ts`, `src/styles/theme.css` (card-specific rules appended)
**Visual References:**
- mockup: analysis/design-context/mockups/learn-mode-card-front.html
  element: screen:learn-mode-card-front
  locator: `.card-shell` / `.card-inner` / `.card-face.card-front` block (inline `<style>` selectors `.card-shell`, `.card-face`, `.card-front`, `.badge`, `.term`, `.flip-hint`)
  acceptance: front face renders category badge + level badge + term (30px, weight 650) + "Tap card to reveal definition" flip-hint text inside a 3:4 aspect-ratio box (`perspective:1200px` on `.card-shell`, `aspect-ratio:3/4` — front-only); flip triggers on tap/click of the card and via spacebar when card is focused; both faces present in DOM simultaneously using `backface-visibility:hidden` (never `display:none`)
- mockup: analysis/design-context/mockups/learn-mode-card-back-flipped.html
  element: screen:learn-mode-card-back
  locator: `.card-shell.card-shell-back` / `.card-face.card-back` block (selectors `.card-shell-back`, `.card-back`, `.back-top`, `.term-small`, `.info-btn`, `.description`, `.translation-pop`, `.pl-term`, `.pl-desc`)
  acceptance: back face uses `min-height:340px` and grows with content (NOT the fixed aspect-ratio box the front uses — corrected mockup behavior); shows small uppercase term repeated at top-left with a circular "(i)" `.info-btn` beside it; full `description` text below; `.info-btn` toggles `.translation-pop` visibility showing BOTH `.pl-term` (`translationPl`) and `.pl-desc` (`descriptionPl`) together, independent of flip state; flip trigger is a real `<button>` element (not a clickable `<div>`)

- [ ] 2.0 Complete the shared Card component in isolation
  - [ ] 2.1 Write 6 focused tests for `Card`:
    - flip toggles `isFlipped` state on click/tap
    - flip toggles on spacebar keypress when card has focus
    - front and back faces are both present in the DOM at all times (query both `.card-front` and `.card-back` regardless of flip state)
    - flip trigger element is a real `<button>` (not a div with a click handler)
    - "(i)" translation toggle sets `isTranslationVisible` independently of `isFlipped` (flipping does not reset translation visibility; un-flipping and re-flipping preserves last translation-toggle state per card instance)
    - Prev/Next navigation callbacks fire with the correct direction and reset `CardViewState` (`isFlipped`, `isTranslationVisible`) for the newly-shown entry
  - [ ] 2.2 Implement `Card.ts` accepting an entry + optional nav callbacks + a `variant` flag (`'full'` for Learn Mode single-card, `'tile'` for Browse grid) so both call sites share one component per spec Section 2
  - [ ] 2.3 Implement flip interaction: click/tap anywhere on the card face, spacebar when focused, using `backface-visibility: hidden` for both faces (never `display:none`, to keep screen-reader/DOM presence per Success Criteria)
  - [ ] 2.4 Implement Prev/Next navigation (button-driven) and basic swipe-gesture detection (touch start/end delta) that only activates when `isFlipped === true`, per the `.swipe-hint` annotation ("swipe ↑ know / ↓ don't know") — swipe itself just emits a callback; Learn Mode (Group 5) wires the callback to mark actions
  - [ ] 2.5 Implement the "(i)" translation toggle button rendering `.translation-pop` with `.pl-term` (`translationPl`) and `.pl-desc` (`descriptionPl`) together, independent of flip/nav state
  - [ ] 2.6 Append Card-specific CSS to `theme.css` (`.card-shell`, `.card-inner`, `.card-face`, `.card-front`, `.card-back`, `.card-shell-back`, `.badge`, `.term`, `.term-small`, `.info-btn`, `.description`, `.translation-pop`, `.pl-term`, `.pl-desc`, `.flip-hint`) copied from both mockups' inline styles, reconciling the front's fixed aspect-ratio box against the back's content-driven `min-height`
  - [ ] 2.7 Manually verify Card against both mockup screens (front static state, back flipped-with-translation state) in a dev-server render before moving on — this is the spec's flagged "build and verify in isolation first" integration seam
  - [ ] 2.8 Ensure Card tests pass
    - Run ONLY the 6 tests written in 2.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 6 tests pass
- Card flips via tap, click, and spacebar; front and back are both present in the DOM (screen-reader accessible via `backface-visibility: hidden`); flip trigger is a real `<button>` (Success Criteria, verbatim)
- Manual comparison against `learn-mode-card-front.html` and `learn-mode-card-back-flipped.html` confirms layout/copy/field-order match each listed `acceptance` criterion above

---

### Task Group 3: Filters, Learn Algorithm & Storage (pure logic)
**Dependencies:** Group 1
**Files to Modify:** `src/lib/filters.ts`, `src/lib/filters.test.ts`, `src/lib/learnAlgorithm.ts`, `src/lib/learnAlgorithm.test.ts`, `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] 3.0 Complete pure/stateless business logic (no DOM dependency)
  - [ ] 3.1 Write 8 focused tests across the three modules:
    - `applyFilters`: category filter alone narrows correctly
    - `applyFilters`: level filter alone narrows correctly
    - `applyFilters`: search matches term, description, `translationPl`, AND `descriptionPl` (all 4 fields)
    - `applyFilters`: category + level + search combine with AND semantics on a small fixture set
    - `learnAlgorithm`: weighted draw demonstrably favors `dont_know` over many draws given a controlled bucket distribution (statistical assertion, e.g. draw 500x, dont_know frequency significantly exceeds its 1-card-among-N share)
    - `learnAlgorithm`: graduates `dont_know`→`know` after exactly 2 consecutive "know" marks, and immediate demotion to `dont_know` on any single "don't know" mark (resets consecutive-know counter)
    - `learnAlgorithm`: excludes the immediately-previous card from the next draw unless it is the only card remaining in the pool (explicit acceptance criterion per spec-audit Finding 6)
    - `storage.ts`: write then read round-trips a `LearnProgressEntry` correctly under key `skillflip:learn-progress`, and reset clears the key entirely
  - [ ] 3.2 Implement `applyFilters(entries, filterState)` pure function: category multi-select + level segmented value + debounced-search-ready substring match (the 200ms debounce timer itself lives in `FilterBar.ts`, Group 4 — this function is synchronous/pure and takes the already-current search string)
  - [ ] 3.3 Implement `learnAlgorithm.ts`: bucket-weighted pool construction using `BUCKET_WEIGHTS` from `config.ts`, uniform-random draw from the weighted pool, previous-card exclusion with single-card fallback, bucket-transition logic (graduate after `GRADUATION_THRESHOLD` consecutive "know", immediate demotion on "don't know")
  - [ ] 3.4 Implement full-mastery fallback: when every entry is in the `know` bucket (weight uniformly 1 for all), draw must degrade gracefully to uniform-random across all entries rather than erroring or looping
  - [ ] 3.5 Implement `storage.ts`: `readProgress()`, `writeProgress(id, entry)`, `resetProgress()` against `localStorage['skillflip:learn-progress']`, plus a `computeBucketCounts(entries)` helper (mastered/shaky/new) that both topbars (Groups 4 and 5) will call — this is the "shared bucket-count computation" the spec-audit fix requires
  - [ ] 3.6 Ensure logic tests pass
    - Run ONLY the 8 tests written in 3.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 8 tests pass
- Browse search matches term, description, `translationPl`, and `descriptionPl`; category and level filters combine correctly with search (Success Criteria, verbatim)
- Learn Mode's weighted draw demonstrably favors `dont_know` cards over repeated draws (verified by unit test); graduation and immediate demotion behave per spec Section 4; previous card excluded from consecutive draws unless it's the only card left; algorithm doesn't break when all cards reach `know` (Success Criteria, verbatim)
- `computeBucketCounts` is the single function both Group 4's Browse topbar and Group 5's Learn Mode topbar call — no duplicate bucket-counting logic

---

### Task Group 4: Browse / Filter / Search UI
**Dependencies:** Group 2 (Card), Group 3 (filters.ts, storage.ts)
**Files to Modify:** `src/components/FilterBar.ts`, `src/components/BrowseGrid.ts`, `src/components/BrowseGrid.test.ts`, `src/styles/theme.css` (filter-bar/grid/empty-state/browse-topbar rules appended)
**Visual References:**
- mockup: analysis/design-context/mockups/browse-filter-and-grid.html
  element: screen:browse-filter-grid
  locator: `.app-shell.wide > .topbar` and `.filter-bar` blocks (selectors `.topbar`, `.brand`, `.progress-stats`, `.filter-bar`, `.search-input`, `.cat-chips`, `.chip`, `.chip.more`, `.level-toggle`, `.lvl`, `.result-count`, `.grid`, `.tile`)
  acceptance: Browse's own topbar renders `.brand` ("Skill Flip") on the left and `.progress-stats` (mastered/shaky/new, monospace, same 3-stat format as Learn Mode) on the right — NOT a shared AppShell topbar component; `.filter-bar` is `position:sticky; top:0`, contains search input (placeholder "Search terms, definitions, PL translation...", debounced 200ms before calling `applyFilters`), category `.chip`s showing `"Name (count)"` with live counts per currently-loaded dataset (not hardcoded), a `.chip.more` overflow chip when >5 categories, and `.level-toggle` segmented control (All/Junior/Regular/Senior); `.result-count` reads `"N of {actual dataset length} terms"` (e.g. "6 of 18 terms" for this pass's starter set, NOT the mockup's placeholder "150"); `.grid` renders `.tile` elements using Card in `'tile'` variant, 3 columns desktop / 2 tablet (640-1023px) / 1 mobile (<640px) via the mockup's exact media query breakpoints
- mockup: analysis/design-context/mockups/browse-empty-state.html
  element: screen:browse-empty-state
  locator: `.empty-state` block (selectors `.empty-state`, `.empty-icon`, `.clear-btn`)
  acceptance: when `applyFilters` yields zero results, `.grid` is replaced entirely by `.empty-state` (icon + "No terms match" heading + helper text "Try clearing a filter or search a different term." + `.clear-btn` "Clear filters" button) while `.filter-bar` and topbar remain visible and functional; clicking "Clear filters" resets search + category + level state and re-renders the grid

- [ ] 4.0 Complete Browse/Filter/Search UI
  - [ ] 4.1 Write 6 focused tests for `BrowseGrid`/`FilterBar` integration:
    - typing in search debounces 200ms before `applyFilters` is invoked (fake timers)
    - category chip toggle updates the multi-select filter state and re-renders the grid
    - level segmented control selection narrows results correctly
    - result count renders `"N of {dataset.length} terms"` using the actual loaded array length, not a hardcoded number
    - empty state renders (grid replaced by `.empty-state`) when filters yield zero matches, and disappears once a match exists
    - "Clear filters" button resets all filter state and restores the full unfiltered grid
  - [ ] 4.2 Implement `FilterBar.ts`: search input with 200ms debounce timer, category chips with live per-category counts computed from the current dataset (all 12 category labels always rendered, count 0 where absent), `+N more` overflow chip, level segmented control
  - [ ] 4.3 Implement `BrowseGrid.ts`: renders its own topbar (`.brand` + `.progress-stats` via `computeBucketCounts` from Group 3's `storage.ts`), mounts `FilterBar`, runs `applyFilters` on state change, renders `.result-count`, renders `.grid` of `Card` instances in `'tile'` variant (collapsed term-only by default, flips in place on tap to show description — no Prev/Next/swipe/translation-toggle chrome for tiles), and swaps in `.empty-state` + wired "Clear filters" CTA when the filtered result set is empty
  - [ ] 4.4 Append Browse-specific CSS to `theme.css` (`.topbar` brand variant, `.filter-bar`, `.search-input`, `.cat-chips`, `.chip`, `.chip.active`, `.chip.more`, `.level-toggle`, `.lvl`, `.result-count`, `.grid` with the 3 documented breakpoints, `.tile`, `.tile.flipped`, `.empty-state`, `.empty-icon`, `.clear-btn`) copied from both mockups' inline styles
  - [ ] 4.5 Ensure Browse tests pass
    - Run ONLY the 6 tests written in 4.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 6 tests pass
- Browse search matches term/description/translationPl/descriptionPl; category and level filters combine correctly with search on the starter dataset; live category counts and result count reflect actual loaded entries, not hardcoded to 150 (Success Criteria, verbatim)
- Empty state renders correctly with a working "Clear filters" CTA when a filter/search combination yields zero results (Success Criteria, verbatim)
- Progress stats render in Browse's own topbar (not borrowed from a shared AppShell topbar), matching Learn Mode's stat format
- Implementation matches each `acceptance` criterion declared in Visual References above

---

### Task Group 5: Learn Mode UI
**Dependencies:** Group 2 (Card), Group 3 (learnAlgorithm.ts, storage.ts)
**Files to Modify:** `src/components/LearnMode.ts`, `src/components/LearnMode.test.ts`, `src/styles/theme.css` (learn-topbar/nav-row/mark-row/bottombar rules appended)
**Visual References:**
- mockup: analysis/design-context/mockups/learn-mode-card-front.html
  element: screen:learn-mode-card-front
  locator: `.app-shell > .topbar` and `.nav-row` blocks (selectors `.topbar`, `.icon-btn[aria-label="Exit Learn Mode"]`, `.progress-stats`, `.icon-btn[aria-label="Reset progress"]`, `.learn-stage`, `.nav-row`, `.nav-btn`, `.swipe-hint`)
  acceptance: Learn Mode's own topbar renders, left-to-right: exit-to-browse icon button (`aria-label="Exit Learn Mode"`), `.progress-stats` (mastered/shaky/new via the same `computeBucketCounts` function Browse uses), reset-progress icon button (`aria-label="Reset progress"`) — three-part layout, distinct from Browse's brand+stats topbar; `.nav-row` below the card renders Prev button, `.swipe-hint` text ("swipe ↑ know / ↓ don't know", only meaningful once flipped), Next button
- mockup: analysis/design-context/mockups/learn-mode-card-back-flipped.html
  element: screen:learn-mode-card-back
  locator: `.mark-row` block (selectors `.mark-row`, `.mark-btn.dont-know`, `.mark-btn.know`)
  acceptance: `.mark-row` (Don't know / Know it buttons) is rendered ONLY when the current card is flipped (`isFlipped === true`) — absent/not interactive on the front face; "Know it" increments consecutive-know count and triggers `learnAlgorithm`'s graduation check; "Don't know" immediately demotes to `dont_know` bucket and resets the consecutive counter; both buttons trigger advancement to the next weighted-drawn card after marking

- [ ] 5.0 Complete Learn Mode UI
  - [ ] 5.1 Write 6 focused tests for `LearnMode`:
    - initial mount draws a card via `learnAlgorithm` with no setup/session step required (always-resumable — no "start session" gate)
    - `.mark-row` (Know it / Don't know) is absent when the current card is unflipped, present when flipped
    - marking "Know it" persists via `storage.ts` and advances to a new weighted-drawn card
    - marking "Don't know" persists demotion via `storage.ts` and advances to a new card
    - progress-stats header reflects live `computeBucketCounts` output against the current dataset after a mark
    - reset-progress control shows a confirmation step before calling `storage.ts`'s `resetProgress()`, and does nothing if confirmation is declined
  - [ ] 5.2 Implement `LearnMode.ts`: renders its own topbar (exit-to-browse icon, `.progress-stats` via `computeBucketCounts`, reset-progress icon), mounts a single `Card` in `'full'` variant fed by `learnAlgorithm`'s weighted draw, wires Prev/Next nav and swipe callbacks from Card to mark actions
  - [ ] 5.3 Wire mark actions (Know it / Don't know) to `learnAlgorithm.ts`'s bucket-transition logic and `storage.ts`'s immediate write-on-every-mark (not just on exit), then trigger the next weighted draw excluding the just-shown card
  - [ ] 5.4 Implement reset-progress control: icon button opens a confirmation (native `confirm()` or an in-app confirm affordance — copy left to implementation discretion per spec-audit Finding 7) before calling `resetProgress()`
  - [ ] 5.5 Append Learn Mode-specific CSS to `theme.css` (`.learn-stage`, `.topbar` icon-btn variant, `.icon-btn`, `.nav-row`, `.nav-btn`, `.swipe-hint`, `.mark-row`, `.mark-btn.know`, `.mark-btn.dont-know`) copied from the mockups' inline styles
  - [ ] 5.6 Ensure Learn Mode tests pass
    - Run ONLY the 6 tests written in 5.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 6 tests pass
- Progress stats header shows accurate live mastered/shaky/new counts against the starter dataset, rendered in Learn Mode's own topbar (Success Criteria, verbatim)
- Reset-progress control clears `localStorage` after confirmation (Success Criteria, verbatim)
- Learn Mode has no session-start step; reopening/resuming always shows a live weighted-drawn card
- Implementation matches each `acceptance` criterion declared in Visual References above

---

### Task Group 6: AppShell & Wiring
**Dependencies:** Group 4 (BrowseGrid), Group 5 (LearnMode)
**Files to Modify:** `src/components/AppShell.ts`, `src/components/AppShell.test.ts`, `src/main.ts`, `src/styles/theme.css` (app-shell/bottombar rules appended)
**Visual References:**
- mockup: analysis/design-context/mockups/learn-mode-card-front.html
  element: component:bottombar-tabs
  locator: `.app-shell` wrapper and `.bottombar` block (selectors `.app-shell` max-width:480px, `.bottombar`, `.tab-btn`, `.tab-btn.active`)
  acceptance: `AppShell` renders the outer `.app-shell` container at 480px max-width when Learn is active; `.bottombar` persists at the bottom with two `.tab-btn` elements (Learn/Browse), the active tab styled per `.tab-btn.active` (bold, sage top-border); AppShell owns ONLY this tab bar and the width variant — it does NOT render a shared topbar (each mounted view supplies its own, per Groups 4/5)
- mockup: analysis/design-context/mockups/browse-filter-and-grid.html
  element: component:bottombar-tabs
  locator: `.app-shell.wide` wrapper (selector `.app-shell.wide` max-width:900px)
  acceptance: switching to Browse swaps the outer container to the 900px "wide" variant and shows `BrowseGrid`'s topbar/filter-bar/grid in place of Learn Mode's content, with the same `.bottombar` persisting and its active tab flipped to Browse; no full page reload or URL/hash change occurs on switch; Learn Mode's in-memory state is not torn down destructively (its actual progress lives in `localStorage` per Group 3/5, so switching tabs never loses it regardless)

- [ ] 6.0 Complete AppShell view-swap wiring
  - [ ] 6.1 Write 5 focused tests for `AppShell`:
    - defaults to Learn tab active on initial mount (per mockups' default state)
    - clicking the Browse tab swaps visible content to `BrowseGrid` and applies the 900px wide container variant
    - clicking the Learn tab swaps back to `LearnMode` and applies the 480px container variant
    - switching tabs does not trigger a page reload or alter `window.location` (no router/hash state)
    - Learn Mode progress (a `localStorage` write made before switching to Browse) is still present after switching back to Learn
  - [ ] 6.2 Implement `AppShell.ts`: manual show/hide of two top-level view containers (`LearnMode`, `BrowseGrid`), owns active-tab state in memory only (no persistence, no URL/hash), renders `.bottombar` with two `.tab-btn` elements, toggles the outer container's max-width class (480px / 900px wide) based on active tab
  - [ ] 6.3 Wire `main.ts`: fetch `data/glossary.json` via `fetch()`, validate non-empty array (visible error state on fetch failure or empty array — no silent blank screen), mount `AppShell` with the loaded glossary
  - [ ] 6.4 Append `.app-shell` / `.app-shell.wide` / `.bottombar` / `.tab-btn` CSS to `theme.css` copied from the mockups' inline styles
  - [ ] 6.5 Ensure AppShell tests pass
    - Run ONLY the 5 tests written in 6.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 5 tests pass
- `AppShell` correctly switches between Learn and Browse views with no lost Learn Mode progress and no page reload/URL change (Success Criteria, verbatim)
- `main.ts` shows a visible error state (not a silent blank screen) if `fetch()` fails or `data/glossary.json` resolves to an empty array
- Implementation matches each `acceptance` criterion declared in Visual References above

---

### Task Group 7: Content Pipeline & Starter Content
**Dependencies:** Group 1 (types)
**Files to Modify:** `content-pipeline/prompt-template.md`, `content-pipeline/rubric.md`, `content-pipeline/validate-glossary.ts`, `content-pipeline/validate-glossary.test.ts`, `content-pipeline/source/engineering-ladder.md` (or reference to existing source), `data/glossary.json`, `package.json` (add `validate-glossary` script)

- [ ] 7.0 Complete content pipeline tooling and author starter dataset
  - [ ] 7.1 Write 5 focused tests for `validate-glossary.ts`:
    - passes on a well-formed fixture array (all required fields present, valid enum values)
    - fails with a clear error when a `category` value is outside the 12-value enum
    - fails with a clear error when a `level` value is outside Junior/Regular/Senior
    - fails on duplicate `id` values within the array
    - fails on duplicate `(term, category)` pairs within the array
  - [ ] 7.2 Implement `validate-glossary.ts`: reads `data/glossary.json`, validates shape/enum-membership/non-empty-array against `src/types/glossary.ts`, checks duplicate `id`s and duplicate `(term, category)` pairs, exits non-zero with a clear message list on any failure
  - [ ] 7.3 Wire `npm run validate-glossary` script in `package.json`, confirmed fully decoupled from `src/` (no import either direction, not bundled into the Vite build)
  - [ ] 7.4 Write `content-pipeline/prompt-template.md` (AI-assisted generation prompt for curating a `GlossaryEntry` from a source taxonomy bullet) and `content-pipeline/rubric.md` (curation quality bar: definitions rewritten not transcribed, PL translation covers full definition not just the term, appropriate level assignment)
  - [ ] 7.5 Author ~15-20 hand-curated Java-category `GlossaryEntry` records spanning Regular and Senior levels into `data/glossary.json` (replacing Group 1's 3-entry fixture stub), using the prompt template + rubric against the source `Engineering Ladder.md` taxonomy, each entry manually reviewed for accuracy
  - [ ] 7.6 Run `npm run validate-glossary` against the real starter dataset and fix any reported issues until it passes with zero errors
  - [ ] 7.7 Ensure content-pipeline tests pass
    - Run ONLY the 5 tests written in 7.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 5 tests pass
- `npm run validate-glossary` passes with zero errors against the starter `data/glossary.json` (~15-20 entries, all 12 `Category` enum values and 3 `Level` enum values accepted by the schema even though only Java entries are populated; no duplicate `id`s; no duplicate `(term, category)` pairs) (Success Criteria, verbatim)
- `content-pipeline/` has zero imports from/to `src/`

---

### Task Group 8: Build, Deploy & Documentation
**Dependencies:** Group 6 (AppShell/main.ts complete), Group 7 (validate-glossary + real content)
**Files to Modify:** `vite.config.ts` (confirm base path), `.github/workflows/deploy.yml`, `README.md`, `LICENSE`

- [ ] 8.0 Complete build, deployment pipeline, and documentation
  - [ ] 8.1 Write 2 focused tests:
    - `npm run build` produces a `dist/` output containing `index.html` with asset paths correctly prefixed by `/skill-flip/` (base path smoke test — can be a script-based assertion rather than a Vitest unit test, run via the same `npm test` gate)
    - a lightweight config-shape test confirming `vite.config.ts` exports `base: '/skill-flip/'`
  - [ ] 8.2 Confirm/finalize `vite.config.ts`'s `base: '/skill-flip/'` setting against the real build output
  - [ ] 8.3 Write `.github/workflows/deploy.yml`: triggered on push to `main`, steps = checkout → `npm ci` → `npm run validate-glossary` → `npm run build` → deploy `dist/` to GitHub Pages, no environment variables/secrets required
  - [ ] 8.4 Add `LICENSE` file (MIT, per clarifications)
  - [ ] 8.5 Write dual-audience `README.md`: project pitch, live link (`https://aib-projekt.github.io/skill-flip/`), tech stack, getting-started steps (`npm install`, `npm run dev`), project structure overview, adding new glossary entries (both manual-edit and content-pipeline paths), MIT license mention
  - [ ] 8.6 Ensure build/deploy tests pass
    - Run ONLY the 2 tests/checks written in 8.1
    - Do NOT run entire test suite

**Acceptance Criteria:**
- The 2 checks pass
- `npm run build` succeeds; the GitHub Actions workflow runs validate → build → deploy on push to `main` (Success Criteria, verbatim — actual live-deploy confirmation happens on first real push, outside this plan's scope)
- `README.md` includes pitch, live link, tech stack, getting-started steps, and both manual-edit and content-pipeline instructions for adding new glossary entries, plus MIT license (Success Criteria, verbatim)

---

### Task Group 9: Test Review & Gap Analysis
**Dependencies:** All previous groups (1-8)
**Files to Modify:** `tests/**/*.test.ts` equivalents — i.e. any of `src/**/*.test.ts`, `content-pipeline/*.test.ts` (appended to, not replaced)

- [ ] 9.0 Review and fill critical gaps
  - [ ] 9.1 Review tests from all previous groups (3 + 6 + 8 + 6 + 6 + 5 + 5 + 2 = 36 existing tests/checks)
  - [ ] 9.2 Analyze gaps for this feature only — likely candidates: Card `variant='tile'` behavior not separately covered by Group 2's tests (only exercised indirectly via Group 4), full-mastery uniform-random fallback distribution shape, AppShell error-state rendering when `fetch()` fails, empty-category chip rendering when a category has zero entries
  - [ ] 9.3 Write up to 10 additional strategic tests covering the highest-value gaps identified in 9.2
  - [ ] 9.4 Run feature-specific tests only (expect ~36-46 total across the whole feature)

**Acceptance Criteria:**
- All feature tests pass (~36-46 total)
- No more than 10 additional tests added
- Every Success Criteria bullet in `implementation/spec.md` is traceable to at least one passing test or documented manual-verification step

---

## Execution Order

1. **Group 1** — Scaffolding, Git & Data Model (9 steps)
2. **Group 2** — Card Component (8 steps, depends on 1) — parallel with 3, 7
3. **Group 3** — Filters, Learn Algorithm & Storage (6 steps, depends on 1) — parallel with 2, 7
4. **Group 7** — Content Pipeline & Starter Content (7 steps, depends on 1) — parallel with 2, 3
5. **Group 4** — Browse/Filter/Search UI (5 steps, depends on 2, 3) — parallel with 5
6. **Group 5** — Learn Mode UI (6 steps, depends on 2, 3) — parallel with 4
7. **Group 6** — AppShell & Wiring (5 steps, depends on 4, 5)
8. **Group 8** — Build, Deploy & Documentation (6 steps, depends on 6, 7)
9. **Group 9** — Test Review & Gap Analysis (4 steps, depends on all)

**Parallel wave summary** (no `--sequential` constraint given, dependency graph supports concurrent dispatch):
- Wave 1: Group 1 (solo — everything else depends on it)
- Wave 2: Groups 2, 3, 7 (all depend only on Group 1; touch disjoint file sets except shared appends to `theme.css` and `package.json` — see note below)
- Wave 3: Groups 4, 5 (both depend on 2+3; touch disjoint files except shared appends to `theme.css`)
- Wave 4: Group 6 (depends on 4+5)
- Wave 5: Group 8 (depends on 6+7)
- Wave 6: Group 9 (depends on all)

**Shared-file contention note**: `src/styles/theme.css` and `package.json` are appended to by multiple groups across Waves 2-6 (theme.css: Groups 1,2,4,5,6; package.json: Groups 1,7,8). The implementation-plan-executor should serialize writes to these two files within a wave (append-only, non-overlapping selector blocks per group) even when the groups themselves run concurrently, to avoid merge clashes.

## Standards Compliance

No `.maister/docs/standards/` directory exists in this project. Follow conventions from `implementation/spec.md`'s Implementation Guidance section instead:
- PascalCase for types/component files (`Card.ts`, `BrowseGrid.ts`, `LearnMode.ts`, `AppShell.ts`)
- camelCase for lib/utility modules (`filters.ts`, `learnAlgorithm.ts`, `storage.ts`, `config.ts`)
- lowercase-kebab-case for `GlossaryEntry.id` slugs
- Two-tier CSS custom-property naming (`--color-*` raw palette → `--bg-*`/`--text-*`/`--accent-*` semantic aliases)

## Notes

- Test-Driven: Each group starts with 2-8 tests before implementation.
- Run Incrementally: Only new tests after each group — never run the entire suite mid-plan.
- Mark Progress: Check off steps as completed.
- Reuse First: Card component (Group 2) is the single highest-leverage reuse point — verify it in isolation against both mockup screens before Groups 4/5 consume it.
- Visual Fidelity: Groups 2, 4, 5, 6 carry binding `Visual References` — implementers must read the referenced mockup file directly (not just this plan's summary) and self-check each `acceptance` bullet before declaring the group done.
- Mockups are pixel-level binding: CSS custom properties, class names, and layout values should be carried into `src/styles/theme.css` and component markup largely verbatim, not reinterpreted (per spec's Visual Design section).
