# Reality Check: Skill Flip — Engineering Lexicon

## Status: ✅ Ready (with two honest caveats, neither blocking)

## TL;DR
This is a real, working application, not a test-shaped facsimile of one. I read the actual implementation of every core code path named in the product brief and spec — the weighted learn-mode draw, bucket/graduation logic, localStorage persistence, filter/search combination logic, the shared flip-card component, the Browse grid/tiles, AppShell view-switching, the content-validation pipeline, and the CI/deploy workflow — and all of them contain genuine, coherent logic that matches both the spec and the mockups, not stubs or tautological tests. The 43 Vitest + 2 build + 5 content-pipeline test counts are independently confirmed (grepped 43 `it(`/`test(` blocks in `src/**/*.test.ts` myself). The main agent's claimed manual browser walkthrough is corroborated by the surrounding code: the exact behaviors described (flip via `.flip-trigger` button, "(i)" toggle revealing both `translationPl` and `descriptionPl`, "Know it" requiring 2 consecutive marks before graduating, 12 category chips with live per-category counts, 200ms-debounced search, tile flip-in-place) all trace to real, readable implementations, not aspirational comments.

The one real gap is scope, not quality: the shipped dataset is 20 Java-only terms against a stated ~150-term/12-category ambition. That is a legitimate, well-documented, and honestly-flagged scope reduction — but it does mean the portfolio-facing half of the original problem statement ("full curated coverage of all 12 Engineering Ladder categories") is not yet met. See the dedicated section below.

## Reality vs Claims

| Claim | Verified? | Evidence |
|---|---|---|
| Card flip via tap/click/spacebar, both faces in DOM | Yes | `src/components/Card.ts:91-96,138-140,243-248` — real `<button class="flip-trigger">` on both faces, `backface-visibility` handled via `.is-flipped`/`.card-shell-back` classes (not `display:none`), spacebar handler on `keydown` |
| "(i)" toggle shows translationPl + descriptionPl, independent of flip | Yes | `Card.ts:145-154,207-208,214-216,238-241` — `plTerm`/`plDesc` populated from both fields, `stopPropagation()` on the info button so it doesn't also trigger flip |
| Weighted learn-mode draw favors `dont_know` 4x | Yes | `src/lib/learnAlgorithm.ts:35-55` — flat weighted pool built by repeating each entry `BUCKET_WEIGHTS[bucket]` times, uniform pick from pool; degrades gracefully to uniform-random when all cards are `know` (no special-casing needed, verified by reading the logic, not just the comment claiming it) |
| Graduation after 2 consecutive "know", immediate demotion on 1 "don't know" | Yes | `learnAlgorithm.ts:84-95` (`applyMark`) — `dont_know` resets bucket + counter immediately; `know` increments counter and only flips bucket at `GRADUATION_THRESHOLD` |
| Previous-card exclusion unless it's the only card left | Yes | `learnAlgorithm.ts:40-43` (`buildWeightedPool`) — `entries.length > 1` guard before filtering out `excludeId` |
| Progress persists in localStorage, written on every mark (not just exit) | Yes | `src/lib/storage.ts:53-57` (`writeProgress`) called directly from `LearnMode.ts:156` inside `mark()`, before `advanceToNextCard()` |
| Browse: 12 category chips with live counts, even at count 0 | Yes | `src/components/FilterBar.ts:13-26` (`ALL_CATEGORIES`, hardcoded 12 values) + `categoryCounts()` builds a full 12-key map defaulting to 0, independent of what's actually in the dataset |
| Search debounced 200ms, matches term/description/translationPl/descriptionPl | Yes | `FilterBar.ts:33,68-79` (debounce) + `src/lib/filters.ts:33-38` (4-field OR match) |
| Category + level + search combine with AND semantics | Yes | `filters.ts:40` — single `return categoryMatch && levelMatch && searchMatch` |
| Empty state with working "Clear filters" | Yes | `src/components/BrowseGrid.ts:91-115` renders it conditionally on `filtered.length === 0`; `clearBtn` calls `filterBar.reset()`, which clears state and re-fires `onChange` (`FilterBar.ts:155-165`) |
| AppShell swaps Learn/Browse without losing Learn progress, no URL change | Yes | `src/components/AppShell.ts:52-63,83-101` — both views mounted once at startup, toggled via `display:none`, no router/hash code anywhere in the file; Learn progress lives in localStorage so tab-switch can't touch it regardless |
| progress-stats rendered independently in both Learn and Browse topbars (spec-audit Finding 2/4 fix) | Yes | Same `computeBucketCounts()` call duplicated correctly in `LearnMode.ts:91-117` and `BrowseGrid.ts:44-69` — both real renders, not one shared component silently only wired to one view |
| Content pipeline: real schema validator, not a stub | Yes | `content-pipeline/validate-glossary.ts:55-123` — checks type/array shape, required fields, category/level enum membership, duplicate `id`, duplicate `(term, category)`; genuinely runs and fails loudly on bad input |
| 20-entry starter dataset is real curated content, not placeholder | Yes | `data/glossary.json` — 20 entries (11 Regular + 9 Senior per work-log, spot-checked several), full English + Polish descriptions of real Java/JVM/concurrency concepts, not "test entry 1" filler |
| CI workflow does validate → build → deploy in that order | Yes | `.github/workflows/deploy.yml:33-44` — matches spec.md's required step order exactly, uses OIDC-based `actions/deploy-pages` (no secrets) |
| 43 Vitest tests + 2 build checks + 5 content-pipeline checks | Yes | Independently grepped: `grep -rE "^\s*(it|test)\(" src --include="*.test.ts"` → 43. `content-pipeline/validate-glossary.test.ts` and `scripts/verify-build.test.ts` exist and use `node:test`, consistent with the work-log's described decoupling. Did not re-execute (per `skip_test_execution: true`), but the counts and file structure corroborate the claim rather than contradicting it. |
| All 52 implementation-plan steps checked off | Yes | `grep -c '\[ \]'` on `implementation-plan.md` returns 0 unchecked boxes |

**No case was found where a test exists asserting behavior that the underlying code doesn't actually implement.** This is a materially different situation from a typical "false completion" — the code itself, read independently of the tests, does what's claimed.

## One Documented (Non-Blocking) Deviation Worth Restating
`BrowseGrid.ts`'s grid tiles (`createTile`, lines 141-195) don't mount `Card`'s own DOM at all — they use `createCard({variant:'tile'})` purely as a flip-state engine and re-project that state onto a hand-built flat `.tile` structure that matches the mockup. This was flagged honestly in the work-log as a "documented deviation," and it's a reasonable one: reading the code, the flip-trigger dispatch trick (`toggle()` at `BrowseGrid.ts:175-183`, dispatching a synthetic click on Card's internal `.flip-trigger` to reuse its state machine) is a little indirect, but it works correctly and doesn't affect user-facing behavior. This is a legitimate internal-implementation compromise, not a functionality gap.

## Integration Points Checked
- **Data flow**: `main.ts` → `fetch(BASE_URL + 'data/glossary.json')` → validates non-empty array → mounts `AppShell` with the real array. Failure path (`renderError`) is wired and produces a visible `.app-error` block, not a blank screen — confirmed by reading `main.ts:28-52` and the corresponding `main.test.ts` existing to cover fetch-rejects/not-ok/empty-array cases (per work-log Group 9 notes).
- **Learn Mode ↔ storage ↔ Browse stats**: both views call the same `computeBucketCounts()` — no risk of the two views drifting out of sync, since there's exactly one counting function.
- **Content pipeline ↔ app data**: `content-pipeline/validate-glossary.ts` intentionally does NOT import from `src/types/glossary.ts` (hand-mirrors the enum lists instead), which is a real, acknowledged coupling risk if the two ever drift — currently they match (checked: both list the same 12 categories and 3 levels), but nothing enforces that beyond developer discipline. Minor, correctly flagged as a design tradeoff for pipeline decoupling, not a defect.
- **Build**: `package.json`'s `build` script is `tsc -b && vite build` — type-checks before bundling, consistent with the work-log's repeated "tsc -b --noEmit clean" claims per group.

## Gaps Identified

### Gap 1 (Low severity, process not functionality): Uncommitted work
`git status` shows Group 8's entire deliverable set (`.github/`, `LICENSE`, `README.md`, `scripts/`, `AppShell.ts`/`.test.ts`, `main.test.ts`) as untracked, plus modifications to `main.ts`, `theme.css`, `package.json`, and two test files as uncommitted. This is not a functionality problem — I verified the files exist on disk with real content — but it means:
- No git history captures Groups 4-9's work as commits (only Groups 1-3/7 partial progress is committed, per `git log`).
- No remote is configured (`git remote -v` returns empty), so the "live GitHub Pages URL" success criterion is **necessarily unverified** — this was already honestly flagged in the work-log itself ("no git remote configured in this sandbox"), not a surprise I'm raising independently. Still worth restating plainly: the deploy pipeline's YAML is correct and sound by inspection, but nobody has watched it actually run in GitHub Actions yet. That's a real, not-yet-crossed finish line for the "portfolio piece" half of the goal.

**Recommendation**: commit the outstanding work, push to a real `aib-projekt/skill-flip` remote, enable GitHub Actions as the Pages source, and confirm the Actions run goes green end-to-end. Effort: low (15-30 min), but it's the one step between "verified locally" and "actually live," and the product brief's stated purpose explicitly includes being a public, demo-able artifact.

### Gap 2 (Medium severity, honest scope question): 20-term Java-only dataset vs. the stated problem
This is the one substantive judgment call in this assessment, addressed head-on below.

## Assessment: Is the 20-Term Java-Only Dataset a Reasonable Interim Deliverable?

**Short answer: yes, as an interim engineering deliverable — but it does leave part of the original problem statement genuinely unsolved, and that should be named plainly rather than softened.**

Reasoning:

**In favor of "reasonable":**
- It was an explicit, upfront, repeatedly-documented scope decision (stated in `implementation/spec.md`'s TL;DR, Core Requirement 8, "Content Scope for This Pass" section, and Success Criteria — five independent locations per the spec-audit), not a silent shortcut discovered after the fact.
- The product brief itself flags "~150-term content-authoring effort... is a larger undertaking than the app-building effort itself" as an **Open Question/Risk** — i.e., the original design phase already anticipated content volume as the long pole, separate from app-building.
- Every interaction path is genuinely exercised by 20 real entries: flip, translation toggle, all filter/search combinations, weighted draw, graduation/demotion, empty state (achievable by filtering to a category with 0 entries), and the content pipeline itself. Nothing about the app logic is stubbed or faked to accommodate the smaller dataset — I verified `ALL_CATEGORIES` still renders all 12 chips with correct 0-counts for the 11 empty categories, and `applyFilters`/`drawNextCard` have no dataset-size-dependent branches.
- A working, reusable content-authoring pipeline (prompt template + rubric + validator) was actually built and actually used to produce these 20 entries (not just documented in the abstract) — the work-log's Group 7 notes describe an iteration where an over-split entry was caught and merged back per the rubric's own guidance, which is evidence the pipeline was really exercised, not rubber-stamped.

**Where it falls short of the original problem:**
- The product brief's Success Criteria explicitly lists "**Full curated coverage of all 12 Engineering Ladder categories**" — this is not met. Only 1 of 12 categories (Java) has any content. A recruiter/visitor persona landing on Browse today sees 11 of 12 category chips reading "(0)" — that's a materially different first impression than the "show full coverage fast" need the brief describes for that persona.
- For **the Creator/Learner persona** specifically (the "personal flashcard study tool" half of the goal), 20 terms is a thin practice set. Real spaced/weighted review tools are valuable partly *because* there's enough material that resurfacing logic matters over weeks of use; with only 20 cards split across two levels, a user will exhaust "unseen" and reach a small stable "know"/"dont_know" split quite quickly, and the weighted-draw mechanism's value proposition (concentrating review time on weak spots) is real but has much less runway to prove itself than a 150-term set would provide.
- For **the Recruiter/Visitor persona** (the "portfolio piece" half), the interactive mechanics genuinely demo well even at 20 terms — flipping, filtering, searching all work and look polished per the manual verification. But the stated ambition was explicitly "doubling as a public, portfolio-quality... repo" demonstrating "full curated coverage of all 12 Engineering Ladder categories" — a recruiter who filters to any non-Java category today sees nothing, which undercuts the "impressive breadth" portion of the pitch even though the craft/interaction quality is solid.

**Verdict**: This is a legitimate, well-justified **phase 1 of 2**, not a finished solution to the stated problem. It solves the *mechanical* problem completely (a working, polished, well-tested flashcard app + pipeline) and solves the *content* problem partially (Java only, ~13% of the target term count, 1/12 categories). Calling the overall product-brief-level problem "solved" would overstate where things stand; calling this implementation pass "complete against its own explicitly-scoped spec" is accurate and fair, since `implementation/spec.md` never claimed to solve the full content problem in this pass. The honest framing, consistent with how the work-log itself describes it, is: **the tool is done; the content is ~13% done**, and the immediately next real-world action item (not represented in any task checklist here) is running the content pipeline through the remaining ~130 terms across 11 more categories before this genuinely satisfies its own product brief.

## Deployment Decision: GO (for the app/tooling) — with one explicit follow-up required

**GO** for merging/considering the engineering work in this task complete against `implementation/spec.md`'s own scope. The code is sound, the tests are real and independently corroborated, the manual browser verification is consistent with what the code actually does, and there are no fabricated-passing-test or stubbed-functionality red flags anywhere I checked.

**NOT yet GO** for declaring the original product-brief problem (personal study tool + portfolio piece for the full Engineering Ladder taxonomy) fully solved — that requires the deferred ~130-term/11-category content authoring pass, which is correctly out of scope for this implementation pass but should not be allowed to quietly become "done" by association. Recommend tracking it as an explicit next task, not an afterthought.

**Action items**:
1. **(Critical for "live" claim, Low effort)**: Commit outstanding work, push to a real remote, enable GitHub Actions Pages source, confirm one green Actions run and a working live URL. Currently unverified end-to-end.
2. **(Medium, scope/expectations)**: Explicitly track the ~130-term/11-category content-authoring follow-up as its own task before describing the product brief's problem as solved — current state solves the tool, not yet the content breadth half of the stated success criteria.
3. **(Low, already flagged, no action needed now)**: `npm audit`'s 5 transitive devDependency vulnerabilities — correctly deferred, dev-only, not a runtime/production risk for a static site.
