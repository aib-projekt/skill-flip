# Requirements

## TL;DR
Requirements gathering confirmed 4 assumptions with no changes: no new onboarding UI beyond the spec'd topbar chip, `EmptyState.ts` extraction is a pure zero-behavior-change refactor for Browse, the 2 already-ingested mockups are sufficient, and the E2E scope covers the full filter → Learn Mode → chip → clear → empty-state → reload-persistence journey.

## Key Decisions
- No additional discovery/onboarding UI beyond what's already spec'd.
- `EmptyState.ts` extraction must produce identical output to Browse's current empty state (pure refactor, not a redesign).
- The 2 ingested mockups (`learn-mode-active-filter-chip.html`, `learn-mode-empty-filtered-subset.html`) are the complete visual reference.
- E2E scope: filter in Browse → switch to Learn Mode → see filter chip → clear it → trigger empty state (zero-match filter) → reload → confirm persistence.

## Open Questions / Risks
- None.

---

## Initial Description

"learn page use subset did set in browser page, remember filtered subset locally in browser" — fully elaborated through the completed product-design workflow at `.maister/tasks/product-design/2026-07-04-learn-filtered-subset`.

## Q&A

**User Journey**: I assume this feature needs no new onboarding/UI affordance beyond what's already spec'd — it's discovered implicitly (Browse's existing filter now also scopes Learn Mode automatically, with the topbar chip as the only new visible signal).
**A:** Yes, correct.

**Existing Code Reuse**: I assume `EmptyState.ts` is the only new component needed, and extracting it from `BrowseGrid`'s current implementation should produce zero visual/behavioral change to Browse's own empty state.
**A:** Yes, correct.

**Visual Assets**: I assume the 2 mockups already ingested (`analysis/design-context/mockups/`) are complete and sufficient — no additional screens/states need to be designed.
**A:** Yes, sufficient.

**E2E Scope**: Since this is UI-heavy, Phase 12 will run browser-based E2E testing. I assume the scope is: filter in Browse → switch to Learn Mode → see the filter chip → clear it → trigger the empty state with a zero-match filter → reload and confirm persistence.
**A:** Yes, correct.

## Similar Features Identified

`BrowseGrid.ts`'s existing filter/empty-state handling is the direct precedent this feature extends into Learn Mode (see `analysis/codebase-analysis.md`).

## Visual Assets & Insights

- `analysis/design-context/mockups/learn-mode-active-filter-chip.html` — Learn Mode card view with the active-filter chip and subset-scoped stats.
- `analysis/design-context/mockups/learn-mode-empty-filtered-subset.html` — Learn Mode's empty state for a zero-match filter.
- Both approved during product design; no changes requested here.

## Functional Requirements Summary

Per the approved `feature-spec.md` (6 sections): persistence schema (`storage.ts`), state ownership/wiring (`AppShell` as mediator), active-filter indicator UI (topbar chip), empty-subset handling (`EmptyState.ts` extraction), progress/stats scoping, and testing requirements (31 existing tests + new coverage).

## Reusability Opportunities

- `EmptyState.ts` — new shared component reused by both `BrowseGrid` and `LearnMode`.
- `computeBucketCounts()` and `applyFilters()` — reused as-is for subset-scoped stats, no changes needed.

## Scope Boundaries

Exactly the approved feature-spec — no scope expansion. Explicitly out of scope (per the original design's Deferred Ideas): cross-device filter sync, per-subset progress views, chip-to-Browse navigation, saved filter presets.

## Technical Considerations

- `LearnMode.ts`'s `entries` is currently a `const` — implementing `updateFilter()` requires a mutable local variable (flagged by gap-analyzer for the implementation-planner).
- Recommended build sequencing (from codebase analysis): `EmptyState.ts` → `storage.ts` → `AppShell` mediation → `LearnMode` (most new surface area, built last).
