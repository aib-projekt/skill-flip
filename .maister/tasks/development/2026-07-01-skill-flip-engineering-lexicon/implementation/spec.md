# Specification: Skill Flip — Engineering Lexicon (Implementation)

## TL;DR
Build the full Skill Flip flashcard app — Vite + vanilla TypeScript, client-only static site — exactly per the 8-section authoritative feature spec, plus one addition: a small `AppShell.ts` for manual Learn/Browse view-swap (no router). This pass ships the complete app, build, deploy pipeline, and content-authoring tooling, but populates `data/glossary.json` with only a **Java-category starter subset (~15-20 terms)**, not the full ~150-term/12-category glossary. Greenfield repo — no existing code to reuse.

## Key Decisions
- Follow `feature-spec.md`'s 8 sections verbatim as the desired-state target — already implementation-ready, validated against mockups, zero reinterpretation needed.
- Add `src/components/AppShell.ts`: manual view-swap between Learn and Browse (show/hide two top-level containers), no routing library, no URL/hash state — resolves the one gap-analysis finding (tab bar visible in all 4 mockups, no mechanism specified in Section 7's file tree).
- Ship a Java-only starter content subset (~15-20 terms spanning Regular and Senior levels) as `data/glossary.json` for this pass; the full 150-term/12-category set is an explicitly deferred follow-up using the content pipeline built here.
- Vitest as the test framework (pairs with Vite, zero extra TS config) — spec is silent on this by design; Phase 1/2 analysis recommends it as a sensible default, not a decision requiring escalation.
- npm as package manager; git initialized fresh as part of this build; repo target `aib-projekt/skill-flip` (Vite `base: '/skill-flip/'`, Pages URL `https://aib-projekt.github.io/skill-flip/`); MIT license.

## Open Questions / Risks
- Full ~150-term, 12-category content authoring remains a follow-up pass using the content pipeline built in this implementation — not part of this pass's completion criteria. A smaller dataset (~15-20 entries) still fully exercises every interaction and algorithm path (flip, filter, search, weighted draw, graduation/demotion, empty state), so nothing is untestable as a result.
- Per-category badge-color mapping, the 100%-mastery celebratory banner, and exact "Reset progress" menu placement are implementation-time details the spec itself leaves open — any consistent, accessible-contrast choice satisfies the requirement; not treated as open questions requiring a decision here.

---

## Goal
Ship a working, deployed, portfolio-quality flashcard web app for reviewing curated Java/Backend engineering terms — flip-card Learn Mode with weighted spaced-style resurfacing, a filterable/searchable Browse grid, bilingual (EN/PL) content, and a documented content-authoring pipeline — built entirely client-side and hosted on GitHub Pages.

## User Stories
- As the Creator/Learner, I want to open the app and immediately resume Learn Mode (no setup step) so that I can review terms in short, frequent study sessions.
- As the Creator/Learner, I want cards I mark "don't know" to reappear more often than ones I know, so that review time concentrates on my weak spots.
- As the Creator/Learner, I want to see the Polish translation of a term and its definition on demand (not forced), so that the English definition stays primary but a lookup is always one tap away.
- As the Recruiter/Visitor, I want to land on a live, interactive demo and flip/filter/search within seconds with no reading required, so that I can quickly assess the creator's skill and craft.
- As the Recruiter/Visitor, I want to browse all terms by category/level with live counts, so that I can scan breadth of coverage fast.
- As the Creator (repo maintainer), I want clear instructions and tooling for adding new glossary entries (manual edit or AI-assisted pipeline), so that growing the glossary from ~15-20 to ~150 terms later is straightforward and reproducible.

## Core Requirements

1. **Data model**: typed `GlossaryEntry` (`id`, `term`, `description`, `translationPl`, `descriptionPl`, `category`, `level`) loaded at runtime from `data/glossary.json` via `fetch()`, held in memory; fails loudly (visible error state) on fetch failure or empty array.
2. **Shared Card component**: single component handling flip (tap/click/spacebar), Prev/Next navigation (button/arrow-key/swipe), and an independent "(i)" translation toggle — reused as-is for Learn Mode's single-card view and (sized down) for Browse grid tiles.
3. **Browse / Filter / Search**: sticky filter bar (search input debounced 200ms before re-running `applyFilters`, multi-select category chips with live counts, level segmented control All/Junior/Regular/Senior), responsive flippable tile grid (1/2/3-4 columns by breakpoint), live "`N` of `total` terms" counter, friendly empty state with "Clear filters" CTA.
4. **Learn Mode**: bucketed weighted-random draw (`dont_know`=4, `unseen`=2, `know`=1 weights), excludes immediately-previous card, graduates `dont_know`→`know` after 2 consecutive "know" marks, immediate demotion to `dont_know` on any miss, live progress stats header (mastered/shaky/new), reset-progress control with confirmation, always-resumable (no session concept).
5. **AppShell (Learn/Browse navigation)**: persistent bottom tab bar switching between Learn and Browse views via manual show/hide — no router, no URL state, Learn Mode progress unaffected by switching. **AppShell owns only the bottom tab bar and the outer container's max-width variant** (480px for Learn, 900px "wide" for Browse, per the mockups). Each view owns and renders its own distinct topbar content: Learn Mode's topbar has an exit-to-browse icon + `progress-stats` + reset-progress icon; Browse's topbar has the brand label + `progress-stats`. **`progress-stats` (live mastered/shaky/new counts) is rendered in BOTH views' topbars**, not Learn Mode only — confirmed by direct inspection of all 4 mockup files, where `browse-filter-and-grid.html` and `browse-empty-state.html` render identical `.progress-stats` markup to the Learn Mode screens. The underlying bucket-count computation is shared (one function reads `localStorage` learn-progress), but each view's own topbar component is responsible for rendering it — AppShell does not own a single shared topbar.
6. **Visual theming**: CSS custom-property palette derived from the AiB Projekt avatar (navy/steel/ice/sage/chartreuse/cream) plus one added terracotta accent for "don't know"; system sans-serif UI font + monospace accent for badges/stats; mobile-first responsive breakpoints; `prefers-reduced-motion` support.
7. **Content generation pipeline**: `content-pipeline/` tooling (prompt template, curation rubric, `validate-glossary.ts` schema validator run via `npm run validate-glossary`) — fully decoupled from `src/`, documented as the reusable path for authoring the remaining ~130+ terms later.
8. **Starter content**: `data/glossary.json` populated with ~15-20 curated, hand-reviewed Java-category entries spanning Regular and Senior levels, passing `validate-glossary.ts` with zero errors.
9. **Build & deployment**: Vite build (`base: '/skill-flip/'`), GitHub Actions workflow (checkout → `npm ci` → `npm run validate-glossary` → `npm run build` → deploy to GitHub Pages) triggered on push to `main`, live at `https://aib-projekt.github.io/skill-flip/`.
10. **Documentation**: dual-audience `README.md` (pitch, live link, tech stack, getting started, adding new glossary entries — manual + pipeline paths, project structure, MIT license).

## Visual Design

Mockups in `analysis/design-context/` are binding inputs — implementation-planner will attach `Visual References` to UI task groups. Four approved, reviewed screens (source: `analysis/design-context/mockups/*.html`, indexed in `analysis/design-context/INDEX.md`):

| Screen ID | Mockup file | Key elements |
|---|---|---|
| `screen:learn-mode-card-front` | `learn-mode-card-front.html` | `.app-shell` (max-width 480px), `.topbar` with exit-to-browse icon + `.progress-stats` (mastered/shaky/new, monospace) + reset-progress icon; `.card-shell` (3:4 aspect-ratio, `perspective:1200px`) showing category badge, level badge, term, flip-hint text; `.nav-row` (Prev/Next buttons + swipe hint); `.bottombar` tab nav (Learn active) |
| `screen:learn-mode-card-back` | `learn-mode-card-back-flipped.html` | Same topbar/bottombar; `.card-shell-back` (grows with content via `min-height`, NOT a fixed aspect-ratio box — this is a corrected behavior from mockup review); term repeated small at top + "(i)" info button; full `.description`; `.translation-pop` block (revealed by "(i)") showing `pl-term` (`translationPl`) AND `pl-desc` (`descriptionPl`) together; `.mark-row` (Don't know / Know it buttons, only rendered when flipped) |
| `screen:browse-filter-grid` | `browse-filter-and-grid.html` | `.app-shell.wide` (max-width 900px); `.topbar` with brand + progress-stats; sticky `.filter-bar` (search input, category `.chip`s with live counts + "+N more" overflow chip, `.level-toggle` segmented control); `.result-count` ("N of 150 terms" — count reflects actual dataset size for this pass); `.grid` of `.tile` elements (flip-in-place, 3 columns desktop / 2 tablet / 1 mobile via media queries); bottombar (Browse active) |
| `screen:browse-empty-state` | `browse-empty-state.html` | Same filter-bar/topbar/bottombar; `.empty-state` block (icon, "No terms match" heading, helper text, "Clear filters" button) replacing the grid when 0 results |

**Fidelity level**: pixel-level — the mockups' inline `<style>` blocks contain the actual production CSS custom properties, class names, and layout values (confirmed by direct inspection of the 4 HTML files); these should be carried into `src/styles/theme.css` and component markup largely verbatim, not reinterpreted.

**Result-count note**: mockups show "N of 150 terms" as placeholder copy reflecting the eventual full glossary; this pass's actual UI must render the true count against whatever the loaded `data/glossary.json` array length is (e.g., "6 of 18 terms") — the counter logic is dataset-size-agnostic per Section 3, so no special-casing is needed for the smaller starter set.

**Shared components** (per `analysis/design-context/INDEX.md`):
- `component:card-shell` — the shared flip component (Learn Mode full view + Browse grid tile, sized down)
- `component:grid-tile` — flippable tile variant of card-shell in the Browse grid
- `component:progress-stats` — live bucket counts from localStorage; rendered in **both** the Learn Mode topbar and the Browse topbar (confirmed in all 4 mockups), not Learn Mode only
- `component:filter-bar` — search + category chips + level toggle, sticky
- `component:bottombar-tabs` — Learn/Browse tab navigation, shared across all 4 screens (implemented via `AppShell.ts`, see below)

## Reusable Components

### Existing Code to Leverage
None. Confirmed by Phase 1 codebase analysis (`analysis/codebase-analysis.md`): the project root has zero source files, no package manifests, and is not a git repository — pure greenfield. There is no sibling code, no existing components, no existing patterns to search for or reuse. The 4 approved mockups and `feature-spec.md` serve as the pattern source instead of prior code.

### New Components Required
Everything is new, since nothing exists. Justification is simply "greenfield build," not a reuse failure:

| File | Purpose |
|---|---|
| `src/types/glossary.ts` | `GlossaryEntry`, `Category`, `Level`, `Glossary` types (Section 1) |
| `src/components/Card.ts` | Shared flip/nav/swipe/translation-toggle component (Section 2) |
| `src/components/BrowseGrid.ts` | Filtered grid of flippable tiles reusing Card (Section 3) |
| `src/components/FilterBar.ts` | Search input, category chips, level toggle (Section 3) |
| `src/components/LearnMode.ts` | Single-card Learn view, progress stats, reset control (Section 4) |
| `src/components/AppShell.ts` | **New — gap-analysis addition.** Owns *only* the bottom tab bar and the outer container's max-width variant (480px Learn / 900px "wide" Browse); manual show/hide of two top-level view containers, no routing library, no URL/hash state. Does **not** own a shared topbar — `LearnMode.ts` and `BrowseGrid.ts` each render their own distinct topbar (both including `component:progress-stats`, computed from the same shared `storage.ts` read). Mounted once from `main.ts`; re-renders whichever view is active without tearing down the other's in-memory state unnecessarily (Learn Mode progress is safe regardless, since it lives in `localStorage`, not component state). |
| `src/lib/filters.ts` | `applyFilters` pure function (Section 3) |
| `src/lib/learnAlgorithm.ts` | Weighted-draw + bucket-transition logic (Section 4) |
| `src/lib/storage.ts` | localStorage read/write helpers for `LearnProgressEntry` records |
| `src/lib/config.ts` | Tunable constants: `BUCKET_WEIGHTS`, `GRADUATION_THRESHOLD` |
| `src/styles/theme.css` | CSS custom-property palette + breakpoints + motion rules (Section 5) |
| `src/main.ts` | Entry point: fetch glossary, mount `AppShell` |
| `content-pipeline/*` | Authoring tooling, decoupled from `src/` (Section 6) |
| `data/glossary.json` | Starter content — ~15-20 Java-category entries |

**Why `AppShell.ts` and not folding tab-bar logic into `main.ts` directly**: keeps `main.ts` a thin bootstrap (fetch data, mount shell) and isolates the one piece of app-wide UI state (which view is active) in a single, testable place — consistent with the spec's existing file-per-concern pattern (e.g. `FilterBar.ts` separate from `BrowseGrid.ts`). This is the minimum addition needed to resolve the gap; no router, no state-management library, no hash-based deep-linking, matching the spec's explicit no-framework/no-state-library discipline (confirmed in `analysis/scope-clarifications.md`).

## Technical Approach

**Data flow**: `main.ts` fetches `data/glossary.json` once at load → validates non-empty array client-side (visible error state on failure, no silent blank screen) → holds in memory → mounts `AppShell`. `AppShell` renders either `LearnMode` or `BrowseGrid`+`FilterBar` based on active tab, both operating on the same in-memory glossary array via two different queue-construction strategies feeding the same `Card` component (filtered list-order subset for Browse; weighted-random draw sequence for Learn Mode).

**State boundaries**:
- Filter/search state (`BrowseFilterState`) — in-memory only, resets on reload, not persisted (Section 3, deliberate).
- Learn progress (`LearnProgressEntry` records) — persisted in `localStorage` under key `skillflip:learn-progress`, written immediately on every mark (not just on exit), survives tab switches and reloads.
- Card view state (`CardViewState`: `isFlipped`, `direction`, `isTranslationVisible`) — local to each `Card` instance, resets on navigation to a new entry.
- Active tab (Learn vs Browse) — owned by `AppShell`, in-memory only, no persistence needed (always starts on Learn per mockups' default state).

**Integration seam requiring care**: the shared `Card` component must accept an ordered queue + index from either call site without knowing which one constructed it — this is the one non-trivial internal abstraction (flagged in gap analysis as the concentrated integration risk). Build and verify `Card` in isolation first, against both mockup screens (front and flipped-back states), before wiring either Browse or Learn Mode to it.

**Content pipeline boundary**: `content-pipeline/` is standalone Node/TS tooling with its own scripts; nothing in `src/` imports from it and nothing in it is bundled into the Vite build. `validate-glossary.ts` is invoked via `npm run validate-glossary`, both manually before commits and as a pre-deploy gate in the GitHub Actions workflow.

**Repo/deploy specifics**: git initialized fresh; root `.gitignore` merges standard Node/Vite ignores with the pre-existing `.idea/.gitignore` rules (preserve `.claude/` and `.maister/` untouched). Vite `base: '/skill-flip/'`; `.github/workflows/deploy.yml` triggers on push to `main`; live URL `https://aib-projekt.github.io/skill-flip/`. No environment variables or secrets required (fully static).

## Content Scope for This Pass

This implementation builds the **complete, production-ready application and tooling** — every component, algorithm, style, pipeline script, and deployment step described above is fully implemented and functional. What is intentionally scoped smaller is the **shipped dataset**:

- `data/glossary.json` ships with **~15-20 hand-curated Java-category entries** (per `analysis/clarifications.md`), spanning both Regular and Senior levels, authored/reviewed using the same pipeline (prompt template + rubric) being built in this pass — demonstrating the pipeline works, not just documenting it.
- The full ~150-term, 12-category glossary (per the source `Engineering Ladder.md` taxonomy) is explicitly **out of scope for this pass** and is a documented follow-up task that reuses `content-pipeline/validate-glossary.ts` and `prompt-template.md` unchanged.
- This scoping does not simplify or stub any app logic: filtering across 12 category values still works correctly even when only "Java" has entries (other category chips simply show a count of 0 or are naturally absent depending on chip-rendering logic — see acceptance criteria); the weighted-draw algorithm, graduation/demotion rules, and search all operate identically regardless of dataset size.

## Implementation Guidance

### Testing Approach
- 2-8 focused tests per implementation step group (task groups anticipated: scaffolding/types, Card component, Browse/Filter/Search, Learn Mode, AppShell, content pipeline, deploy/docs).
- Test framework: Vitest (pairs with Vite, no extra TS config).
- Prioritize unit tests for pure/stateless logic with explicit acceptance criteria: `applyFilters` (category+level+search combination correctness), `learnAlgorithm` (weighted draw favors `dont_know`, graduation after 2 consecutive "know", immediate demotion on miss, previous-card exclusion, full-mastery uniform-random fallback), `storage.ts` read/write round-trip.
- Use manual/exploratory verification (against the 4 mockups as the reference oracle) for flip/swipe/keyboard interaction, visual theming, and responsive breakpoints — not the target of unit tests.
- Test verification runs only new tests per group, not the entire suite, per step.

### Standards Compliance
No `.maister/docs/standards/` directory exists in this project (confirmed: `.maister/docs/` is entirely absent). No project-specific coding standards to reference. Conventions to follow instead come directly from the authoritative feature spec and codebase-analysis report: PascalCase for types/component files (`Card.ts`, `BrowseGrid.ts`), camelCase for lib/utility modules (`filters.ts`, `learnAlgorithm.ts`, `storage.ts`), lowercase-kebab-case for `GlossaryEntry.id` slugs, two-tier CSS custom-property naming (`--color-*` raw palette → `--bg-*`/`--text-*`/`--accent-*` semantic aliases).

## Out of Scope
- Full ~150-term, 12-category content authoring (deferred follow-up pass using the pipeline built here).
- Cross-device sync of Learn Mode progress (localStorage only — accepted, documented limitation).
- Full spaced-repetition scheduling algorithms (bucketed weighted-random draw is the deliberately simpler chosen approach).
- Multi-language UI beyond the existing PL data fields (no i18n framework, no language switcher — PL content is data, not UI chrome translation).
- Hash-based or history-API routing between Learn and Browse (manual view-swap only, per gap-analysis resolution).
- User accounts, backend, or server-side persistence of any kind.
- A dedicated "100% mastery" celebratory banner (nice-to-have per spec, not required for v1).

## Success Criteria
- `npm run validate-glossary` passes with zero errors against the starter `data/glossary.json` (~15-20 entries, all 12 `Category` enum values and 3 `Level` enum values accepted by the schema even though only Java entries are populated; no duplicate `id`s; no duplicate `(term, category)` pairs).
- `Card` component flips via tap, click, and spacebar; front and back are both present in the DOM (screen-reader accessible via `backface-visibility: hidden`, not `display:none`); flip trigger is a real `<button>`.
- Browse search matches term, description, `translationPl`, and `descriptionPl`; category and level filters combine correctly with search on the starter dataset; live category counts and result count reflect the actual loaded entries (not hardcoded to 150).
- Empty state renders correctly with a working "Clear filters" CTA when a filter/search combination yields zero of the starter-set entries.
- Learn Mode's weighted draw demonstrably favors `dont_know` cards over repeated draws (verified by unit test with a controlled bucket distribution); graduation (2 consecutive "know") and immediate demotion (1 "don't know") behave per Section 4; previous card is excluded from consecutive draws unless it's the only card left; algorithm doesn't break when all starter-set cards reach `know` (uniform-random fallback).
- Progress stats header shows accurate live mastered/shaky/new counts against the starter dataset, rendered in **both** the Learn Mode topbar and the Browse topbar; reset-progress control clears `localStorage` after confirmation.
- `AppShell` correctly switches between Learn and Browse views with no lost Learn Mode progress and no page reload/URL change.
- `npm run build` succeeds; the GitHub Actions workflow runs validate → build → deploy on push to `main` and produces a working page at `https://aib-projekt.github.io/skill-flip/`.
- `README.md` includes pitch, live link, tech stack, getting-started steps, and both manual-edit and content-pipeline instructions for adding new glossary entries, plus MIT license.
- Site is git-initialized with a merged `.gitignore` (root scaffold + `.idea/.gitignore` rules), `.claude/` and `.maister/` left untouched.
