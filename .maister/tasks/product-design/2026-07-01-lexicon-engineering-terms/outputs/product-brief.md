# Product Brief: Skill Flip — Engineering Lexicon

## TL;DR
A personal, mobile-first flashcard web app for reviewing curated Java/Backend engineering vocabulary (Regular/Senior), sourced from a 12-category Engineering Ladder taxonomy — doubling as a public, portfolio-quality GitHub repo. Built as a client-only Vite + vanilla TypeScript static site (no backend), with a shared single-card component (flip, swipe, bilingual EN/PL) for Learn Mode, a flippable grid for Browse/Filter/Search, a bucketed weighted-random learn algorithm, a documented AI-assisted content pipeline, and a visual identity drawn from the creator's GitHub org avatar. Fully specified across 8 implementation-ready sections and validated against 4 interactive mockups. Ready for development handoff.

## Key Decisions
- Client-only, static site (Vite + vanilla TypeScript, no framework) deployed via GitHub Actions to GitHub Pages — no backend, no environment secrets.
- Both goals — personal study utility and public portfolio quality — are equal priority; neither was scoped down for the other.
- Content is curated & rewritten (not transcribed) from the Engineering Ladder source via an AI-assisted generation pass, documented as a reusable, checked-in pipeline (prompt template + rubric + validation script).
- Learn Mode uses a bucketed weighted-random draw (not binary in/out, not full spaced repetition) — `dont_know` cards weighted 4x, graduate to `know` after 2 consecutive correct marks.
- One shared single-card component (tap-to-flip, Prev/Next, swipe accelerators) serves Learn Mode; a flippable grid serves Browse/Filter/Search — reducing duplication while serving both the Creator's focused review and the Recruiter's fast-scan needs.
- Polish translation covers both the term AND the full definition (`translationPl` + `descriptionPl`) — revised during mockup review from an initial term-only assumption.
- Visual identity is a CSS custom-property palette derived from the AiB Projekt GitHub avatar (muted navy/steel/sage/chartreuse/ice/cream), plus one deliberate non-avatar terracotta accent for the "don't know" state.

## Open Questions / Risks
- ~150-term content-authoring effort (via the AI-assisted pipeline + creator review) is a larger undertaking than the app-building effort itself — no fixed timeline.
- The learn-mode graduation threshold (2 consecutive "know" marks) and bucket weights (4/2/1) are configurable constants — may need tuning after real usage.
- Per-category badge-color assignment, the 100%-mastery celebratory state, and the README license choice are left as implementation-time details, not specified here.

---

## Layer 0: Core Brief

### Problem Statement
There's no personal, well-organized tool for reviewing the Java/Backend Senior-level engineering vocabulary defined in the Engineering Ladder taxonomy, and no polished, public artifact demonstrating that knowledge (and frontend craft) to recruiters or visitors. The raw source material (~150 skill bullets across 12 categories) exists but isn't in a reviewable, flashcard-friendly shape.

Full detail: [`analysis/problem-statement.md`](../analysis/problem-statement.md)

### Target Users
Two equal-priority personas — see Layer 1 below for full cards.

### Feature Overview
- **Data model**: typed `GlossaryEntry` (`id`, `term`, `description`, `translationPl`, `descriptionPl`, `category`, `level`) loaded from `data/glossary.json`.
- **Card & flip interaction**: single shared component — tap-to-flip, Prev/Next, swipe accelerators, a separate "(i)" toggle revealing the full Polish translation without affecting flip/navigation state.
- **Browse / Filter / Search**: category (12 values) + level (Junior/Regular/Senior) filters, full-text search across term/description/translation, a responsive flippable-tile grid, live result counts and category counts, a friendly empty state.
- **Learn Mode**: bucketed weighted-random draw (`unseen`/`know`/`dont_know`), always resumable with no session concept, live progress readout, a reset-progress control.
- **Visual design**: mobile-first responsive layout, CSS custom-property palette from the AiB Projekt GitHub avatar, system sans-serif + monospace accent typography, reduced-motion support.
- **Content pipeline**: documented prompt template, curation rubric, and validation script (`npm run validate-glossary`), checked in under `content-pipeline/`, fully separated from runtime app code.
- **Project structure, build & deployment**: Vite build, GitHub Actions → GitHub Pages, no secrets/env vars needed.
- **Documentation**: dual-audience README (creator's future reference + recruiter skim), including explicit instructions for adding new glossary entries.

Full detail (implementation-ready, all 8 sections): [`analysis/feature-spec.md`](../analysis/feature-spec.md)

### Constraints
- Client-only, static site — no backend/server, deployable to GitHub Pages
- Data/UI separated via `data/glossary.json`
- Content curated & rewritten via AI-assisted generation pass, reviewed by the creator
- Mobile-first, touch-friendly responsive design
- Visual identity from the AiB Projekt GitHub avatar palette
- No cross-device sync (localStorage only — accepted limitation, not a gap)

### Success Criteria
- Used for real, repeated study sessions (not abandoned after week one)
- Demo-able as a strong first impression (CV/portfolio/LinkedIn link)
- Recruiter-readable codebase and README
- Full curated coverage of all 12 Engineering Ladder categories
- Learn Mode's weighted resurfacing feels smart, not gimmicky

### Acceptance Criteria (condensed from feature-spec.md)
- `glossary.json` validates against the `GlossaryEntry` schema with zero errors from `npm run validate-glossary`
- Card flips via tap, keyboard (spacebar), and reads correctly to screen readers (front/back both in DOM, `backface-visibility` hidden)
- Search matches term, description, and both Polish fields; category/level filters combine correctly with search
- Learn Mode's weighted draw demonstrably favors `dont_know` cards over multiple draws; graduation and demotion rules behave per Section 4's pseudocode
- Site builds and deploys via the GitHub Actions workflow to a working GitHub Pages URL with zero manual steps beyond `git push`
- README covers project pitch, live link, tech stack, getting started, and "adding new glossary entries" (manual + pipeline paths)

---

## Layer 1: Persona Cards

### The Creator (Primary — Learner)
Backend/Java engineer studying toward Senior-level roles. Short, frequent (5-10 min) mobile study sessions during commute/downtime. Needs Learn Mode to resume instantly with zero setup friction; occasionally browses/filters outside Learn Mode to look something up directly.

### The Recruiter/Visitor (Secondary — Evaluator)
Technical recruiter, hiring manager, or peer engineer browsing a portfolio. Arrives via a CV/LinkedIn/GitHub link, lands directly on the live demo, and expects to interact (flip/filter/search) within seconds — no reading required first. May click through to the repo/README afterward for more depth.

Full detail + user journeys: [`analysis/personas.md`](../analysis/personas.md)

---

## Layer 2: Design Decisions

| Decision Area | Selected Approach | Why |
|---|---|---|
| Tech stack | Vite + vanilla TypeScript, no framework | Modern tooling signal + type-safe glossary schema without framework over-engineering for a 3-mode, ~150-entry app |
| Learn-mode algorithm | Bucketed weighted-random draw (4/2/1 weights, 2-mark graduation) | Matches explicit "not binary, not full SRS" requirement; simple, explainable, doubles as progress UI |
| Interaction model | Single-card-with-controls (Learn Mode) + flippable grid (Browse/Filter/Search) | One shared component minimizes duplication; grid serves the "show full coverage fast" recruiter need |
| Content pipeline | Documented, checked-in artifact (prompt + rubric + validation script) | Makes the "curated, not transcribed" quality bar demonstrable and reusable, not just claimed |

Full alternatives considered, trade-offs, and evidence: [`analysis/alternatives.md`](../analysis/alternatives.html) · Selected approach rationale: [`analysis/design-decisions.md`](../analysis/design-decisions.html)

---

## Layer 3: Mockup References

Four interactive mockups were built and reviewed via the visual companion, covering both personas' primary journeys:

| Screen | Purpose | File |
|---|---|---|
| Learn Mode — Card Front | Term side, category/level badges, progress stats | [`analysis/mockups/learn-mode-card-front.html`](../analysis/mockups/learn-mode-card-front.html) |
| Learn Mode — Card Back (Flipped) | Definition + know/don't-know marking + PL translation toggle | [`analysis/mockups/learn-mode-card-back-flipped.html`](../analysis/mockups/learn-mode-card-back-flipped.html) |
| Browse — Filter and Grid | Category/level filters, search, flippable tile grid | [`analysis/mockups/browse-filter-and-grid.html`](../analysis/mockups/browse-filter-and-grid.html) |
| Browse — Empty State | Zero-result friendly empty state with clear-filters CTA | [`analysis/mockups/browse-empty-state.html`](../analysis/mockups/browse-empty-state.html) |

Two corrections surfaced during mockup review and were folded back into the spec: a card-back layout bug (fixed-aspect-ratio box overflowing on longer definitions, now grows with content) and a scope gap (Polish translation initially specced as term-only, corrected to cover the full definition — `descriptionPl` added to the schema).

---

## References

- [`analysis/design-context.md`](../analysis/design-context.md) — unified synthesis of all context sources
- [`analysis/problem-statement.md`](../analysis/problem-statement.md) — full problem statement, constraints, success criteria
- [`analysis/personas.md`](../analysis/personas.md) — persona cards + user journeys
- [`analysis/alternatives.md`](../analysis/alternatives.html) — solution exploration (4 decision areas, 14 alternatives)
- [`analysis/design-decisions.md`](../analysis/design-decisions.html) — selected approach, rationale, trade-offs
- [`analysis/feature-spec.md`](../analysis/feature-spec.html) — full 8-section implementation-ready specification
- [`analysis/mockups/`](../analysis/mockups/) — interactive visual prototypes
