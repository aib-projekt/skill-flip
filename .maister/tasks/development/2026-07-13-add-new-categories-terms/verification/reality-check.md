# Reality Check: Add New Taxonomy Categories & FilterBar Overflow Redesign

## Status: ✅ Ready

Independent, from-scratch verification (tests re-run, `tsc -b`/`validate-glossary` re-run, and the actual FilterBar exercised live in a running browser via direct DOM/event dispatch — not just reading test assertions) confirms the work-log's claims are accurate. No false-completion risk identified. This is not a "tests pass in isolation but the feature is broken" situation — the exact three user-facing questions asked (14 real chips, genuinely bidirectional overflow, reset-collapses-overflow) were each independently reproduced outside the test suite and behaved correctly.

## Reality vs Claims

| Claim (work-log.md) | Independently Verified | Method |
|---|---|---|
| 67 vitest tests + 2 test:build checks pass | ✅ Confirmed, byte-identical counts | Ran `rtk proxy npx vitest run` and `npm test` from a clean shell, not reused CI output |
| `tsc -b` clean | ✅ Confirmed, exit 0 | Ran directly |
| `npm run validate-glossary` — 159 entries, 0 errors | ✅ Confirmed | Ran directly |
| Category taxonomy is 14 values, 4 mirrors in sync | ✅ Confirmed | Read `glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`, `glossary.test.ts` directly — all 14 identical, correctly ordered |
| FilterBar renders 7 visible + "+7 more", 14 on expand, "Show less" relabel | ✅ Confirmed **live in the running app**, not just via jsdom test | Started dev server, loaded Browse with the real 159-entry dataset, dispatched real click events on the real DOM |
| Collapse ("Show less") returns to 7 visible + "+7 more" | ✅ Confirmed live | Same live session |
| Selection survives expand → select → collapse → re-expand | ✅ Confirmed live | Selected "Software Architecture" while expanded, collapsed, re-expanded, chip still had `.active` class |
| `reset()` / "Clear filters" also collapses an expanded list | ✅ Confirmed live | Expanded, selected a chip, clicked `.clear-btn`, chip list returned to 8 elements (7 + "+7 more"), 0 active chips |
| Zero stale "12 categories"/"12-value"/"5 visible" prose across the 10 named files | ✅ Confirmed | Grepped all 10 files directly; zero matches |
| `rubric.md` "Curating from a Polish source" section inserted correctly, renumbered | ✅ Confirmed | Read section headers directly: Section 4 is the new subsection, 5-8 correctly shifted |
| Implementation plan fully checked off | ✅ Confirmed | Zero unchecked `- [ ]` items |
| All 4 spec-audit findings (architecture.md contradiction, FilterBar.ts:12 comment, prompt-template.md, README.md, architecture.md:30 rewrite) resolved | ✅ Confirmed | Read `architecture.md` lines 19/30/49 directly — all three now say 14/7-visible-symmetric-collapse; grepped `FilterBar.ts:12`, `prompt-template.md`, `README.md` — all clean |

No gap found between what work-log.md claims and what actually runs.

## Success Criteria Audit (spec.md, verified individually, not on faith)

1. **`Category` type has exactly 14 values, correct order, appended after `'Software Engineering'`** — ✅ verified by reading `src/types/glossary.ts` directly; order matches spec exactly.
2. **All 3 non-test taxonomy copies identical** — ✅ verified byte-for-byte across `glossary.ts`, `FilterBar.ts`'s `ALL_CATEGORIES`, `validate-glossary.ts`'s `VALID_CATEGORIES`.
3. **`npm run validate-glossary` passes, 159 entries** — ✅ ran it myself, output: `validate-glossary: OK — 159 entries validated with zero errors.`
4. **`npm test` passes including updated/retargeted/new tests** — ✅ ran it myself: 67 vitest + 2 test:build, all green. `BrowseGrid.test.ts` shows 14 tests including the retargeted overflow test (now targets "Microservices & Distributed Systems" as the 14th/last category) and the new collapse test.
5. **`tsc -b` clean** — ✅ ran it myself, exit 0.
6. **7 visible + "+7 more" → 14 on expand + "Show less" → 7 + "+7 more" on collapse** — ✅ verified in a live browser against real production data (159 entries), not a mock. This is the one requirement most at risk of "passes in jsdom but not in reality" and it was reproduced end-to-end outside the test harness.
7. **Selection state survives expand/collapse in both directions** — ✅ verified live: selected while expanded, collapsed, re-expanded, `.active` class persisted. This closes spec-audit Finding 4's traceability gap — the new `BrowseGrid.test.ts` collapse test (lines 198-236) now explicitly asserts this, and I independently reproduced the same sequence outside the test file.
8. **"Clear filters" collapses an expanded chip list** — ✅ verified live via `.clear-btn` dispatch: chip count went from 15 (14 + Show less) to 8 (7 + "+7 more"), 0 chips left active.
9. **Expand/collapse state not persisted, starts collapsed on fresh instance** — ✅ consistent with code read: `showAllCategories` is a closure-local `let`, never read from or written to `localStorage`/`BrowseFilterState`; every fresh `createFilterBar()` call initializes it to `false`.
10. **`rubric.md` "Curating from a Polish source" subsection present, correctly positioned, renumbered** — ✅ verified: Section 4, after Section 3 (translationPl/descriptionPl scope), before old Section 4 (now 5); sections 5-8 confirmed renumbered with no gaps.
11. **Zero remaining stale-count prose across the 10 named files** — ✅ verified via direct grep across all 10 files (`glossary.ts`, `validate-glossary.ts`, `rubric.md`, `vision.md`, `roadmap.md`, `architecture.md`, `engineering-ladder.md`, `FilterBar.ts`, `prompt-template.md`, `README.md`) for `12[- ]categor|12-value|remaining 11|5 visible` — zero matches in all 10.

**Every Success Criteria bullet verified true against running/actual state, not against the work-log's narration.**

## Answering the Three Specific Questions

**Does the taxonomy genuinely have 14 working categories, not just at the type level?**
Yes. Confirmed by loading the real 159-entry `data/glossary.json` in a running browser and reading the actual rendered chip labels: `Java (20), Spring/JEE (17), Data Storage (22), DevOps (4), Cloud Engineering (8), Testing (15), Soft Skills (5)` visible by default, and on expand: `+ Management (4), Mentoring (2), Problem Solving (4), API Development (26), Software Engineering (32), Software Architecture (0), Microservices & Distributed Systems (0)` — 14 distinct category chips with live, correctly-computed counts (the two new categories correctly show 0, since entry curation is explicitly out of scope per spec and not a defect).

**Does FilterBar chip overflow genuinely work bidirectionally?**
Yes, both directions independently exercised via real `dispatchEvent` clicks on the live DOM (not assumptions from reading the test file): expand (7→14, relabel to "Show less") and collapse (14→7, relabel to "+7 more") both work, and the same DOM element is reused for both labels (confirmed by querying `.chip.more` before and after — one element, text content changes). This was the one genuinely new piece of logic per the spec (the prior implementation was write-once by design defect, per spec.md's own "New Components Required" section) and it is the part I scrutinized most heavily; it holds up.

**Does "Clear filters" genuinely collapse an expanded chip list?**
Yes, independently verified: expanded the list, selected a chip, clicked the real `.clear-btn` element, and the chip DOM collapsed back to the compact 8-element (7 + trailing) state with zero active selections — matching `reset()`'s code path (`showAllCategories = false` alongside `Object.assign(state, defaultState())`).

## Gaps Found

None that block deployment. Two pre-existing, explicitly-scoped-out conditions worth noting for completeness (not defects introduced by this task, and both are explicitly disclosed in spec.md's Out of Scope section):

- **Accessibility**: category chips remain `<span>` with click listeners, no keyboard access, no `aria-expanded` on the overflow toggle. Pre-existing, codebase-wide pattern; spec explicitly preserves it and flags it in `analysis/gap-analysis.md` as a candidate for a future task. Not a regression.
- **Zero-entry categories**: "Software Architecture" and "Microservices & Distributed Systems" render as legitimate 0-count chips until a future content-curation pass populates them. Explicitly pre-approved interim state per spec's Out of Scope section, and cosmetically indistinguishable from a bug unless you know this — worth flagging to whoever reviews the deployed Browse page so it isn't mistaken for broken filtering.

## Integration Check

`src/lib/filters.ts`, `src/lib/storage.ts`, `src/components/LearnMode.ts` all consume `Category` via `import type` only — verified these files require zero changes and none were touched; `tsc -b` passing end-to-end confirms the type-level widening flows through cleanly with no exhaustive-switch breakage anywhere in `src/` or `content-pipeline/`.

## Deployment Decision: GO

Every claim in work-log.md was independently reproduced from a clean state: full test suite (not just feature tests), `tsc -b`, `validate-glossary`, and — going beyond what the test suite covers — live browser interaction against the real 159-entry dataset for all three specifically-questioned behaviors (14-category rendering, bidirectional overflow, reset-collapse). No discrepancy between claimed and actual state was found. Safe to proceed to code review / merge.
