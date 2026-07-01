# Visual Coverage Matrix

Source: `analysis/design-context/INDEX.md`

| Screen/Component ID | Covered By Task Group(s) | Status |
|---------------------|---------------------------|--------|
| `screen:learn-mode-card-front` | Group 2 (Card Component — front face), Group 5 (Learn Mode UI — topbar/nav-row), Group 6 (AppShell — 480px container/bottombar) | ✅ |
| `screen:learn-mode-card-back` | Group 2 (Card Component — back face/translation toggle), Group 5 (Learn Mode UI — mark-row) | ✅ |
| `screen:browse-filter-grid` | Group 2 (Card Component — tile variant), Group 4 (Browse/Filter/Search UI — topbar/filter-bar/grid), Group 6 (AppShell — 900px wide container/bottombar) | ✅ |
| `screen:browse-empty-state` | Group 4 (Browse/Filter/Search UI — empty-state block) | ✅ |
| `component:card-shell` | Group 2 (Card Component) | ✅ |
| `component:grid-tile` | Group 2 (Card Component — `'tile'` variant), Group 4 (Browse/Filter/Search UI — grid rendering) | ✅ |
| `component:progress-stats` | Group 3 (Storage — `computeBucketCounts` shared function), Group 4 (Browse topbar rendering), Group 5 (Learn Mode topbar rendering) | ✅ |
| `component:filter-bar` | Group 4 (Browse/Filter/Search UI) | ✅ |
| `component:bottombar-tabs` | Group 6 (AppShell & Wiring) | ✅ |

## Uncovered Items

All screens covered. All 5 shared components covered. No uncovered items.

**Note on `component:progress-stats`**: this component is intentionally split across three groups rather than owned by one — Group 3 builds the shared computation (`computeBucketCounts`, reading `localStorage` learn-progress), while Groups 4 and 5 each independently render it in their own topbar markup, per the spec-audit fix (Finding 2/4) that corrected the original assumption that progress-stats belonged to Learn Mode only. This split is deliberate, not a coverage gap — the Visual References in Group 4 and Group 5 both cite the mockup markup showing identical `.progress-stats` structure in both topbars.
