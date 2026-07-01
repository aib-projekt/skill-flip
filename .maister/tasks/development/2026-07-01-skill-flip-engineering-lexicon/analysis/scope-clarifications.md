# Phase 2 Scope Clarifications

## TL;DR
One important decision resolved: view-switching between Learn Mode and Browse (shown as a persistent tab bar in all 4 mockups, but unspecified as an implementation mechanism in the feature spec) will be handled by a small `AppShell.ts` doing manual view-swap — no routing library, no hash-based routing.

## Key Decisions
- View-switching mechanism: `AppShell.ts`, manual view-swap (show/hide or re-render between Learn and Browse). No router. (rationale: matches the spec's own no-framework/no-state-library discipline; no deep-linkable sub-states exist to justify a router)

## Open Questions / Risks
- None outstanding from this decision.

---

## Decision Detail

**Issue**: All 4 approved mockups render a persistent bottom `Learn`/`Browse` tab bar (`component:bottombar-tabs`), but `feature-spec.md` Section 7's file tree has no dedicated module for it and no section describes the view-switching mechanism.

**Options considered**: manual view-swap in a small `AppShell.ts`; hash-based routing (`#learn` / `#browse`); a dedicated `AppShell.ts`/`TabBar.ts` split.

**Selected**: Manual view-swap via `AppShell.ts` — toggles between Learn and Browse views directly, no routing library. Will be added to the Phase 7 implementation plan's file structure alongside the components already listed in feature-spec.md Section 7.
