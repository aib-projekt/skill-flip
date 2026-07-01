# Gap Analysis: Skill Flip — Engineering Lexicon (Implementation)

## TL;DR
Current state is a true blank slate (no source, no git, no manifests); desired state is fully described by an implementation-ready 8-section feature spec plus 4 binding mockups. There is no legacy code to reconcile with, so this is a pure "build to spec" gap — the only genuine gaps found are (1) the app-shell/tab-navigation layer (Learn ↔ Browse switching) is visible in the mockups but has no dedicated file/module in the spec's Section 7 tree, and (2) several implementation-time defaults (test framework, badge-color mapping, full-mastery banner) are explicitly deferred by the spec itself and need a pragmatic choice during build, not a spec change. Risk level is confirmed **Low-Medium**, consistent with Phase 1.

## Key Decisions
- Treat the feature-spec.md + 4 mockups as the authoritative desired-state target verbatim — no reinterpretation needed, since Phase 1 already confirmed zero design ambiguity blocking implementation.
- Do not re-raise git-init, repo target, content scope, or license — these are closed decisions from `analysis/clarifications.md` and are carried into `orchestrator-state.yml` task_context already.
- Classify this task as `creates_new_entities` + `involves_data_operations` + `ui_heavy`, all `true`; `has_reproducible_defect` and `modifies_existing_code` both `false` — there is no bug and nothing pre-existing to modify.
- Integration points are "none" in the legacy-system sense (nothing to integrate with) but "several" in the new-app sense (Learn↔Browse tab switching, shared Card component consumed by two different queue-construction strategies) — both are addressed below as the new-capability integration surface.

## Open Questions / Risks
- The app-shell / tab-navigation layer (bottom `Learn`/`Browse` tab bar, visible and interactive in all 4 mockups via `data-screen` attributes) has no corresponding file in the spec's Section 7 project-structure tree and no described state-management approach (routing library? manual `main.ts` view-swap? hash-based?) — flagged below as an important decision for the orchestrator to confirm before/during specification.
- A handful of items are explicitly deferred by the spec itself as "implementation-time details" (per-category badge-color mapping, 100%-mastery celebratory banner, test framework/linter selection) — these are not gaps requiring user decisions, just defaults to be chosen sensibly during implementation; flagged as low-priority/optional so the orchestrator can decide whether to surface them or let implementation choose.

## Summary
- **Risk Level**: Low-Medium (confirmed, unchanged from Phase 1)
- **Estimated Effort**: Medium (breadth across data model, shared component, two feature areas, content pipeline, deployment — not deep in any one area)
- **Detected Characteristics**: creates_new_entities, involves_data_operations, ui_heavy

## Task Characteristics
- Has reproducible defect: no
- Modifies existing code: no
- Creates new entities: yes
- Involves data operations: yes
- UI heavy: yes

## Gaps Identified

### Missing Features
Everything described in the feature spec is missing, since the codebase is empty. Enumerated by spec section:

- **Data model & content** (Section 1): `src/types/glossary.ts` (GlossaryEntry/Category/Level types), `data/glossary.json` (starter subset of ~15-20 terms per Phase 1 clarification, not the full ~150).
- **Card & flip interaction** (Section 2): the shared `Card` component (`src/components/Card.ts`) — flip, Prev/Next, swipe, keyboard, "(i)" translation toggle, accessibility (dual-DOM front/back, real `<button>` triggers).
- **Browse/Filter/Search** (Section 3): `src/lib/filters.ts` (`applyFilters` pure function), `src/components/FilterBar.ts`, `src/components/BrowseGrid.ts`, empty-state UI, live category counts.
- **Learn Mode** (Section 4): `src/lib/learnAlgorithm.ts` (weighted draw), `src/lib/storage.ts` (localStorage helpers), `src/components/LearnMode.ts`, progress-stats readout, reset-progress control.
- **Visual theming** (Section 5): `src/styles/theme.css` (CSS custom-property palette), responsive breakpoints, reduced-motion handling.
- **Content pipeline** (Section 6): `content-pipeline/` tooling — `source/engineering-ladder.md`, `prompt-template.md`, `rubric.md`, `validate-glossary.ts`.
- **Project structure/build/deploy** (Section 7): `package.json`, `tsconfig.json`, `vite.config.ts` (base `/skill-flip/` per clarifications), `index.html`, `.github/workflows/deploy.yml`, root `.gitignore` (merged with existing `.idea/.gitignore`), git repository itself.
- **Documentation** (Section 8): dual-audience `README.md`.

### Incomplete Features
Not applicable — nothing partially exists. This is 100% greenfield.

### Behavioral Changes Needed
Not applicable — no existing behavior to change.

### Gap: App Shell / Tab Navigation (not explicit in Section 7 tree)

All 4 mockups render a concrete `.app-shell` wrapper with a `.bottombar` containing `Learn` / `Browse` `.tab-btn` elements (confirmed in `learn-mode-card-front.html` markup: `<nav class="bottombar"><button class="tab-btn active">Learn</button><button class="tab-btn" data-screen="browse-filter-and-grid">Browse</button></nav>`), and `INDEX.md` explicitly lists `component:bottombar-tabs` as appearing in "all 4 screens." However, feature-spec.md's Section 7 file tree has no dedicated file for this (no `AppShell.ts`, no `TabBar.ts`, no `Router.ts`), and no section describes how switching between Learn Mode and Browse view is implemented (single-page view-swap in `main.ts` vs. hash routing vs. something else) or how state is preserved across the switch (e.g., Learn Mode progress must persist when switching to Browse and back, which the spec does address for localStorage but not for the *view-switching mechanism itself*).

This is a real but small gap — the mockups make the intended UI unambiguous, only the implementation mechanism is unstated.

## User Journey Impact Assessment
(New capability — no "current" state to compare against; assessed as absolute discoverability of the finished app)

| Dimension | Assessment |
|-----------|-------------|
| Reachability | Learn/Browse both reachable via a persistent bottom tab bar on every screen (per mockups) — no dead ends, no direct-URL-only paths. |
| Discoverability | 9/10 — bottom tab bar is a standard, universally recognized mobile pattern; category chips/search are visible immediately on Browse; flip affordance has an explicit `flip-hint` text cue ("Tap card to reveal definition") reducing reliance on prior knowledge. |
| Flow Integration | Positive — Learn Mode is always-resumable (no setup step per spec Section 4), Browse's "Exit Learn Mode" control returns without losing progress (Section 3). Recruiter persona lands directly on an interactive demo with zero required reading. |
| Multi-Persona | Both personas (Creator/Learner, Recruiter/Visitor) share the identical UI with no role-gating — consistent with the "no backend, no accounts" constraint. No persona-specific access gaps. |

## Data Lifecycle Analysis

### Entity: GlossaryEntry (content data)

| Operation | Backend | UI | Access | Status |
|-----------|---------|-----|--------|--------|
| CREATE | `content-pipeline/` tooling (AI-assisted generation + manual JSON edit, per Section 6/8) — no runtime CREATE, by design (static content) | N/A — authored offline, not via in-app UI | README Section 8 documents both manual-edit and pipeline paths | Complete by design (static-content app; CREATE is an authoring-time operation, not a runtime one — this is an intentional, documented scope boundary, not an orphan) |
| READ | `fetch('./data/glossary.json')` at load (Section 1) | `Card` component (front/back), `BrowseGrid` tiles (Section 2/3) | Rendered on both Learn and Browse screens, reachable via bottom tab bar | Complete (spec-described) |
| UPDATE | Direct JSON file edit or re-run pipeline (Section 8) | N/A — no in-app edit UI (by design; this is a curated, creator-controlled dataset, not user-editable content) | N/A | Complete by design — not a gap; matches the "personal curated glossary" product framing, not a general CRUD app |
| DELETE | Direct JSON file edit (remove entry) | N/A | N/A | Complete by design |

**Completeness**: 100% against the spec's intended scope. This is *not* a general-purpose CRUD entity — CREATE/UPDATE/DELETE are deliberately authoring-time/offline operations (content-pipeline + manual JSON edits), not runtime user operations. Only READ needs to be a runtime, in-app capability, and the spec fully addresses that (fetch → Card/BrowseGrid → tab-bar-reachable). No orphaned operations.

### Entity: LearnProgressEntry (localStorage progress data)

| Operation | Backend | UI | Access | Status |
|-----------|---------|-----|--------|--------|
| CREATE | Implicit — `storage.ts` writes a `LearnProgressEntry` on first mark for a given card id (default `unseen` if absent, per Section 4) | Swipe up/down or equivalent mark controls, only visible when `isFlipped === true` (Section 2) | Learn Mode screen, reachable via tab bar | Complete |
| READ | `storage.ts` read helper; progress-stats computed by counting buckets across all entries on each render (Section 4) | `progress-stats` header element (mastered/shaky/new counts) | Visible at top of Learn Mode screen at all times | Complete |
| UPDATE | Bucket/consecutiveKnowCount transition logic in `learnAlgorithm.ts` (Section 4) | Same mark controls as CREATE | Same as CREATE | Complete |
| DELETE | "Reset progress" clears entire localStorage key (Section 4) | Reset button with confirmation prompt, in a settings/menu area | Explicitly specified as "visible," though exact placement (header icon vs. menu) is left to implementation | Complete — placement is a minor implementation detail, not a gap |

**Completeness**: 100%. All four operations are specified across backend logic, UI controls, and user-reachable placement. No orphaned operations detected — this was checked specifically because progress data is exactly the kind of entity prone to "write without display" or "display without reset" bugs, and the spec closes both.

**Missing Touchpoints**: none identified — the mockups confirm the reset-progress icon button exists in the Learn Mode topbar (`aria-label="Reset progress"` in the `.topbar`), so even the "exact placement" note above is resolved by the mockup even though the spec text alone left it open.

## Architectural Impact (New Capability)

- **New files**: ~20-25 files across `src/`, `data/`, `content-pipeline/`, `.github/workflows/`, plus root config files — matches Phase 1's "Medium" file-count estimate.
- **Integration points** (new-capability sense — no legacy system exists to integrate with):
  - Shared `Card` component consumed by two different call sites (`LearnMode.ts` single-card flow, `BrowseGrid.ts` grid-tile flow) via the common "ordered queue + index" interface described in Section 2 — this is the one place internal integration risk is concentrated.
  - Tab-bar switching between Learn and Browse views (see gap above) — needs a decision on mechanism during specification/implementation-planning, not blocking gap analysis.
  - `content-pipeline/` is explicitly decoupled from `src/` (no imports either direction) — confirmed zero integration surface between authoring tooling and runtime app, by design.
  - GitHub Actions workflow integrates `npm run validate-glossary` as a pre-deploy gate (Section 7) — the only "integration" with an external system (GitHub Pages), and it's secret-free/static.
- **Patterns to follow**: none pre-existing in this repo (no sibling features to mirror) — the mockups and feature spec serve as the pattern source instead of existing code, which is the expected shape for a new-capability gap analysis when the codebase itself is empty.
- **Architectural impact**: Low-Medium. No framework decisions remain open (vanilla TS is fixed), no backend/API layer to design, and the trickiest internal seam (shared Card component dual-use) is already described precisely enough in Section 2 to de-risk it.

## Issues Requiring Decisions

### Critical (Must Decide Before Proceeding)
None. Nothing found blocks moving to specification/planning — the spec is implementation-ready and all closed decisions (git init, repo target, content scope, license) are already resolved and carried in `orchestrator-state.yml`.

### Important (Should Decide)
1. **App-shell / tab-navigation mechanism is unspecified**: The mockups show a persistent bottom tab bar (`Learn` / `Browse`) on every screen, but feature-spec.md Section 7's file tree has no dedicated component/module for it and no section describes the switching mechanism.
   - Options: (A) Simplest — a manual view-swap in `main.ts` (show/hide two top-level containers, no routing library, no URL change) matching the "no framework, minimal deps" constraint; (B) hash-based routing (`#/learn`, `#/browse`) for shareable/bookmarkable deep links and browser-back support; (C) a tiny dedicated `AppShell.ts`/`TabBar.ts` component encapsulating the bottom bar + active-view state, called from `main.ts`.
   - Recommendation: (A) combined with (C) — a small `AppShell.ts` owning the tab bar and active-view toggle, no routing library, no URL state. This matches the spec's explicit "no framework, no state-management library" philosophy (Section 7 / design-decisions.md) and the app has no deep-linkable sub-states worth a router (Learn Mode has no session concept per Section 4, Browse filters are intentionally not persisted per Section 3). Hash routing would be over-engineering relative to the spec's own stated scope discipline.
   - Rationale: this is a "how," not a "what" — the desired end-user behavior (bottom tab bar, Learn↔Browse switching, no lost progress) is already unambiguous from the mockups; only the internal file/module organization is undecided, which is normally a specification/planning-phase call rather than a product decision. Flagging as "important" rather than "critical" because it does not block moving forward — it can be resolved during the specification phase by adding one file to the Section 7 tree.

### Should Document (informational — implementation-time defaults already flagged by the spec itself, not new gaps)
- Per-category badge-color assignment (12 categories → sub-palette tints) — spec explicitly says "any consistent, accessible-contrast mapping satisfies the requirement."
- 100%-mastery celebratory banner — spec explicitly says "nice-to-have, not required for v1."
- Test framework/linter selection — spec is silent by design; Phase 1 recommends Vitest (pairs naturally with Vite, zero extra TS config) as a sensible default, not a decision requiring user input.
- README license text — already resolved (MIT, per clarifications.md); only the file needs writing.

## Recommendations
- Carry the app-shell/tab-navigation gap into the specification phase as an addition to Section 7's file tree (e.g., add `src/components/AppShell.ts` or fold the tab-bar into `main.ts` directly) rather than treating it as an open product question — the visual/behavioral answer is already fixed by the mockups.
- Preserve the build sequence Phase 1 already recommended (types → fixture data → shared Card component → Browse → Learn Mode → theming → content pipeline → deploy → README); nothing in this gap analysis changes that ordering.
- When specification/planning names the test framework, default to Vitest without treating it as a decision point — it satisfies the spec's own acceptance criteria (weighted-draw favors dont_know, filter/search correctness) with zero additional tooling weight.

## Risk Assessment
- **Complexity Risk**: Low-Medium — breadth (3 feature areas + pipeline + deploy) rather than depth; the one non-trivial internal seam (shared Card component, dual queue-construction) is already well-specified.
- **Integration Risk**: Low — no legacy system, no external APIs, no secrets; the only "integration" is the GitHub Actions → Pages deploy step, which is fully static and low-risk per Phase 1.
- **Regression Risk**: None — no existing code or users to regress. All risk is forward-looking build-quality risk, not compatibility risk.
