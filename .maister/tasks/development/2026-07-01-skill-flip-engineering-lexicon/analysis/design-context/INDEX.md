# Design Context Index

Source: product-design task `.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/` (approved product brief + 4 interactive mockups). These are **binding inputs** to implementation — layout, copy, and interaction states shown here are not placeholders.

## Screens

| ID | Source Mockup | Description |
|---|---|---|
| `screen:learn-mode-card-front` | `mockups/learn-mode-card-front.html` | Learn Mode, term side of the flip card — category/level badges, term, flip hint, progress stats header (mastered/shaky/new), Prev/Next controls, swipe hint. |
| `screen:learn-mode-card-back` | `mockups/learn-mode-card-back-flipped.html` | Learn Mode, description side of the flip card — full English definition, "(i)" toggle revealing the Polish term + full translated definition, know/don't-know marking buttons, Prev/Next controls. |
| `screen:browse-filter-grid` | `mockups/browse-filter-and-grid.html` | Browse/Filter/Search — search input, category chips with live counts, level segmented control, result count, responsive grid of flippable card tiles. |
| `screen:browse-empty-state` | `mockups/browse-empty-state.html` | Browse zero-result state — same filter header, friendly empty-state message with icon and "Clear filters" CTA. |

## Shared Components (referenced across screens)

| ID | Appears In | Description |
|---|---|---|
| `component:card-shell` | `screen:learn-mode-card-front`, `screen:learn-mode-card-back` | The shared single-card component (flip animation, front/back faces) — per spec Section 2, this exact component (sized down) is reused for grid tiles in `screen:browse-filter-grid`. |
| `component:grid-tile` | `screen:browse-filter-grid` | Flippable tile variant of `component:card-shell` used in the Browse grid — collapsed (term only) by default, flips in place to reveal description. |
| `component:progress-stats` | `screen:learn-mode-card-front`, `screen:learn-mode-card-back` | Live-computed bucket counts ("N mastered · N shaky · N new") from `localStorage` learn-progress, shown in the Learn Mode header. |
| `component:filter-bar` | `screen:browse-filter-grid`, `screen:browse-empty-state` | Search input + category chip multi-select (with live counts) + level segmented control; sticky header. |
| `component:bottombar-tabs` | all 4 screens | Learn / Browse tab navigation, shared across the whole app shell. |

## Notes for Implementation

- Visual identity (palette, typography) is defined as CSS custom properties directly in the mockup `<style>` blocks — carry these into `src/styles/theme.css` per spec Section 5, don't reinvent.
- Two corrections were made during product-design mockup review (both already reflected in the mockup files and the spec): the card-back layout grows with content instead of clipping to a fixed aspect-ratio box, and the Polish translation toggle reveals both the term AND the full translated definition (`translationPl` + `descriptionPl`), not term-only.
- Full narrative context, personas, and decision rationale: `analysis/design-context/brief.md`.
