# Design Context Index

Source: `.maister/tasks/product-design/2026-07-04-learn-filtered-subset` (product-design task — brief + mockups ingested at development-orchestrator initialization).

## Screens

| ID | Source Mockup | Description |
|---|---|---|
| `screen:learn-mode-active-filter` | `mockups/learn-mode-active-filter-chip.html` | Learn Mode card view showing the new active-filter chip ("Java · Senior ✕") in the topbar, alongside subset-scoped mastered/shaky/new progress stats. |
| `screen:learn-mode-empty-filtered-subset` | `mockups/learn-mode-empty-filtered-subset.html` | Learn Mode's new empty state when the active filter matches zero glossary entries — reuses Browse's existing empty-state visual pattern with adapted copy and a "Clear filter" action. |

## Components

| ID | Source Mockup | Description |
|---|---|---|
| `component:filter-chip` | Both screens (`.filter-chip`) | New dismissible pill in Learn Mode's topbar showing the active category/level filter; tapping the ✕ clears the filter through the same path as Browse's own reset. |
| `component:empty-state` | `learn-mode-empty-filtered-subset.html` (`.empty-state`) | Shared empty-state component (icon + heading + body + action button) extracted from `BrowseGrid.ts`'s existing `renderEmptyState()`, reused by both Browse and Learn Mode. |

## Notes

- Both screens are UI-only wireframes for existing app surfaces (Learn Mode's topbar and card stage) — no new top-level views or routes are introduced.
- Full behavioral specification for these screens/components is in `brief.md` (this directory) and the product-design task's `analysis/feature-spec.md`.
