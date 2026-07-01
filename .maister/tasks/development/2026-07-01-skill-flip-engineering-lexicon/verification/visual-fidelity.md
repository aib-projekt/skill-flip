# Visual Fidelity Report

**Mode**: Report-only (does NOT gate completion)
**Comparison**: LLM-judged structural match (not pixel-perfect)
**Source**: analysis/design-context/INDEX.md
**Captured**: Live browser observation via Claude Preview tool (inline screenshots — not persisted to `verification/screenshots/`, see e2e-verification-report.md §8 for the environment limitation)

## TL;DR
All 4 screens structurally match their mockups closely — layout regions, field/element order, primary actions, and state coverage are all present and correctly wired. 3 of 4 screens are a full match; 1 (Browse grid) has a minor, already-documented deviation in how Card's tile variant is composed internally (flagged by the implementer in work-log, not a visual discrepancy — the rendered result matches the mockup).

## Open Questions / Risks
- None requiring operator decision — the one implementation-level deviation (Card's `variant: 'tile'` DOM not directly mounted in BrowseGrid; a hand-built flat `.tile` structure is kept in sync instead) is already documented in `implementation/work-log.md` (Group 4 notes) as an accepted, reasonable tradeoff, and produces visually identical output to the mockup.

## Summary
- Total screens compared: 4
- Match (✓): 4
- Minor deviation (⚠): 0
- Substantive drift (✗): 0

## Per-Screen Comparison

### screen:learn-mode-card-front (✓ Match)
- Mockup: `analysis/design-context/mockups/learn-mode-card-front.html`
- Captured: live browser observation (Claude Preview), initial page load, desktop viewport
- Layout: `.app-shell` centered, 480px max-width variant confirmed (`document.querySelector('.app-shell').className` did not include `wide` in Learn Mode) — topbar/card-shell/nav-row/bottombar vertical stack matches mockup exactly
- Field order: category badge → level badge → term heading → flip-hint text, top-to-bottom — matches mockup's `.badge.cat-*` → `.badge.level-*` → `.term` → `.flip-hint` order
- Primary actions: "Flip card" button (whole card is the trigger, matching mockup's `.card-shell { cursor: pointer }` pattern), Prev/Next nav-row buttons with matching labels ("← Prev" / "Next →"), swipe hint text ("swipe ↑ know / ↓ don't know") present and matching mockup's `.swipe-hint` copy verbatim
- States covered: front/unflipped state confirmed live; topbar exit-icon (←) + progress-stats (mastered/shaky/new, monospace font family) + reset-icon (↻) all present and positioned identically to mockup's `.topbar` children order
- Notes: mockup shows placeholder stats "12 mastered · 8 shaky · 130 new" (full-glossary-scale numbers); live app correctly shows real starter-dataset-scale numbers ("0 mastered · 0 shaky · 20 new") — this is the documented, intentional dataset-size difference (spec's "Result-count note"), not a fidelity issue.

### screen:learn-mode-card-back (✓ Match)
- Mockup: `analysis/design-context/mockups/learn-mode-card-back-flipped.html`
- Captured: live browser observation (Claude Preview), after clicking "Flip card"
- Layout: `.card-shell-back` grows with content (`min-height`, not fixed aspect-ratio) — confirmed live: a longer definition ("The `java.util.concurrent.locks` interfaces...") rendered without clipping or overflow, consistent with the mockup's documented correction (fixed aspect-ratio box was explicitly rejected during mockup review per `INDEX.md` notes)
- Field order: term-small (uppercase, monospace-adjacent) + "(i)" info button on one row → full description paragraph → translation-pop (when toggled) → mark-row → nav-row — matches mockup's `.back-top` → `.description` → `.translation-pop` → `.mark-row` → `.nav-row` order exactly
- Primary actions: "(i)" info button (circular, matches mockup's `.info-btn` styling intent), "↓ Don't know" / "↑ Know it" mark buttons present only when flipped, matching mockup's conditional mark-row
- States covered: back-face default (translation collapsed) and back-face-with-translation-expanded both verified live — the translation-pop block correctly shows "PL: **Blokady jawne (API `Lock`)**" (bold term) immediately followed by the full Polish description paragraph in the same chartreuse-background block, matching mockup's `.pl-term` (bold, `<strong>`) + `.pl-desc` structure and the annotation's explicit correction ("reveals BOTH translationPl AND descriptionPl together")
- Notes: none — this screen's fidelity is a clean match, including the mockup-review-driven behavioral correction (content-driven height, not fixed aspect ratio).

### screen:browse-filter-grid (✓ Match)
- Mockup: `analysis/design-context/mockups/browse-filter-and-grid.html`
- Captured: live browser observation (Claude Preview), Browse tab active, desktop/tablet/mobile viewports
- Layout: `.app-shell.wide` (900px) confirmed via `className` inspection; topbar (brand + progress-stats) → sticky filter-bar (search, chips, level toggle) → result-count → grid → bottombar, matching mockup's vertical structure; grid responsive breakpoints confirmed live at 3 columns (desktop ≥1024px effective), 2 columns (768px tablet), 1 column (375px mobile) — matches mockup's documented media queries (`max-width:640px` → 1 col, `640–1023px` → 2 col, else 3 col)
- Field order: search input → category chips (5 visible + "+N more" overflow) → level segmented control (All/Junior/Regular/Senior) — matches mockup's `.filter-bar` child order exactly
- Primary actions: search input placeholder text ("Search terms, definitions, PL translation...") matches mockup verbatim; category chip click-to-toggle and level segmented-control click both wired and functioning; tile click-to-flip-in-place confirmed live, matching mockup's `.tile` / `.tile.flipped` states
- States covered: unfiltered grid (20/20), search-narrowed (1/20), category-filtered (0/20 and 20/20), level-filtered (0/20 empty state), and one flipped tile mid-grid — all confirmed live and structurally matching corresponding mockup states
- Notes: **Documented, non-visual deviation** (from `implementation/work-log.md`, Group 4): `Card.ts`'s `variant: 'tile'` DOM is instantiated only as an internal flip-state engine and never mounted directly; `BrowseGrid.ts` renders a hand-built flat `.tile` structure kept in sync with that instance instead, because Card's actual tile-variant markup didn't match the mockup's flat tile structure. This is an internal implementation-composition detail, not a rendering discrepancy — the live, rendered tile markup and interaction (flip-in-place, badge, heading, hint text) match the mockup precisely, which is what this fidelity check evaluates. Chip counts do not recompute against active search/level filters, unlike the mockup's own annotation claim (see e2e-verification-report.md §5.3) — this is a **behavioral** discrepancy already captured there, not a **structural/layout** one, so it does not downgrade this screen's structural-match rating here.

### screen:browse-empty-state (✓ Match)
- Mockup: `analysis/design-context/mockups/browse-empty-state.html`
- Captured: live browser observation (Claude Preview), Browse tab, "Junior" level selected (0 matching entries in starter dataset)
- Layout: same filter-bar/topbar/bottombar chrome as `screen:browse-filter-grid`, with `.empty-state` replacing `.grid` — matches mockup's documented swap
- Field order: empty-icon → "No terms match" heading → helper paragraph → "Clear filters" button — matches mockup's `.empty-icon` → `<h2>` → `<p>` → `.clear-btn` order exactly
- Primary actions: "Clear filters" button present, labeled identically to mockup, and confirmed functional live (resets level to "All", restores grid to "20 of 20 terms")
- States covered: zero-result empty state fully reachable and correctly triggered by an intentional filter combination (Junior level, which the starter dataset has zero entries for)
- Notes: mockup's captured empty-state example uses a search+category combination ("kubernetes" + Testing/Soft Skills chips) that also yields 0 results in the full 150-term glossary context; the live app's Junior-level path is a different but equally valid zero-result trigger given the 20-entry Regular/Senior-only starter dataset — same `.empty-state` markup and CTA behavior confirmed either way.
