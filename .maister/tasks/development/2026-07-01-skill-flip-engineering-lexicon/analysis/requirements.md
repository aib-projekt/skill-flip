# Requirements: Skill Flip — Engineering Lexicon

## TL;DR
Build exactly what's specified in the product-design handoff: a Vite + vanilla TypeScript client-only flashcard app (data model, card/flip interaction, browse/filter/search, learn mode, visual theming, content pipeline, deployment, README — 8 spec sections), plus one gap-analysis addition (`AppShell.ts` for Learn/Browse tab switching). This implementation pass authors a Java-category starter content subset (~15-20 terms) rather than the full ~150-term glossary. npm is the package manager. No scope beyond the 4 approved mockups and 2 personas.

## Key Decisions
- No new screens/flows beyond the 4 approved mockups and 2 documented personas — confirmed by user.
- Starter content subset authored from the Java category (~15-20 terms) — showcases both Regular and Senior tiers.
- npm as package manager, matching the spec's existing `npm run` scripts.

## Open Questions / Risks
- Full ~150-term, 12-category content authoring remains a follow-up pass using the content pipeline built here — not part of this implementation's completion criteria.

---

## Initial Description
Implement the Skill Flip engineering lexicon flashcard app: Vite + vanilla TypeScript, client-only static site, glossary data model, single-card flip/learn-mode component + browse grid, bucketed weighted-random learn algorithm, documented AI content pipeline, GitHub Pages deployment — handed off from a completed and approved product-design workflow.

## Q&A

**Q: User journey / visual assets — build exactly what's designed, no new screens?**
A: Correct. Scope is exactly the 4 mockups (`screen:learn-mode-card-front`, `screen:learn-mode-card-back`, `screen:browse-filter-grid`, `screen:browse-empty-state`) and the 2 personas (Creator/Learner, Recruiter/Visitor) documented in `analysis/design-context/`.

**Q: Existing code/patterns to reuse?**
A: N/A — pure greenfield, no existing code (confirmed in Phase 1 codebase analysis).

**Q: Starter content category?**
A: Java.

**Q: Package manager?**
A: npm.

## Similar Features Identified
None — greenfield project, no sibling code to pattern-match against. The 4 mockups and `feature-spec.md` serve as the pattern source.

## Visual Assets & Insights
Already ingested into `analysis/design-context/` during orchestrator initialization (Step 4):
- `analysis/design-context/mockups/` — 4 approved interactive HTML mockups
- `analysis/design-context/brief.md` — condensed product brief
- `analysis/design-context/INDEX.md` — screen/component inventory (4 screens, 5 shared components)

These are binding inputs — layout, copy, and interaction states shown in the mockups are not placeholders.

## Functional Requirements Summary
Per `feature-spec.md` (8 sections, implementation-ready) plus the Phase 2 gap-analysis addition:
1. Data model & content schema (`GlossaryEntry` with `descriptionPl`)
2. Card & flip interaction (shared single-card component)
3. Browse / Filter / Search (grid, category/level filters, search across term+description+both PL fields)
4. Learn Mode (bucketed weighted-random draw, 4/2/1 weights, 2-mark graduation)
5. Visual design & theming (AiB Projekt avatar palette + terracotta accent)
6. Content generation pipeline (prompt template + rubric + validation script)
7. Project structure, build & deployment (Vite + GitHub Actions + GitHub Pages) — **plus** `AppShell.ts` for Learn/Browse tab switching (gap-analysis addition)
8. Documentation (dual-audience README)

## Reusability Opportunities
- `component:card-shell` reused across Learn Mode (full single-card view) and Browse (sized-down grid tile) — one flip implementation, two presentations.
- Content pipeline validation script (`validate-glossary.ts`) reusable for future category additions beyond this pass's Java starter subset.

## Scope Boundaries
**In scope**: everything in `feature-spec.md`'s 8 sections + `AppShell.ts`, populated with a Java-category starter content subset (~15-20 terms).
**Out of scope for this pass**: full ~150-term, 12-category content authoring (deferred to a follow-up pass using the content pipeline); cross-device sync; full spaced-repetition scheduling; multi-language UI beyond the PL data fields.

## Technical Considerations
- Git will be initialized as part of this implementation (Phase 1 clarification).
- Repo target: `aib-projekt/skill-flip` → Vite `base: '/skill-flip/'`, Pages URL `https://aib-projekt.github.io/skill-flip/`.
- MIT license.
- npm as package manager.
