# Solution Exploration: Skill Flip — Engineering Lexicon

## TL;DR
Four open decision areas explored: tech stack, learn-mode weighting algorithm, card/navigation model, and content-pipeline packaging. Recommendation: **Vite + vanilla JS/TS (no framework)** for the stack, a **bucketed weighted-random draw** (not decaying weights, not full SRS) for resurfacing, a **single-card-with-controls model with swipe gestures layered on top** for interaction, and a **documented, checked-in AI generation pipeline** (prompt template + review checklist) as a repo artifact in its own right. All four choices favor "recruiter-readable craft" without tipping into over-engineering, matching the equal-priority personal-study/portfolio goals.

## Key Decisions
- Recommend Vite + vanilla TS over plain HTML/CSS/JS — small, well-understood build step signals frontend craft to recruiters at near-zero complexity cost, and TS gives free type-checking against `glossary.json`. — trade-off accepted: one more toolchain dependency (npm) for a project that could technically run with zero tooling.
- Recommend bucketed weighted-random resurfacing (3 buckets: new/unseen, know, don't-know, with don't-know drawn ~3-4x more often) over decaying-weight or streak-based models. — trade-off accepted: less "adaptive" than a true SRS, but matches the explicit non-goal of full spaced repetition and is trivially explainable in a README.
- Recommend single-card-with-controls (Prev/Flip/Next + swipe-left/right layered on top) over a full swipeable Tinder-style stack or a grid-of-flippable-cards. — trade-off accepted: less flashy than a physics-based swipe stack, but far more robust for filtering/search state and keyboard/desktop parity.
- Recommend packaging the AI content-generation step as a documented, versioned pipeline (prompt template + rubric + `npm run validate-glossary` script) rather than an undocumented one-off. — trade-off accepted: extra authoring time upfront, but this becomes a visible portfolio artifact in itself ("I designed a content pipeline," not just "I used AI to write text").

## Open Questions / Risks
- The bucketed algorithm needs a concrete rule for "when does a don't-know card graduate back to a lower-priority bucket" — deferred to specification-creator to pin exact thresholds (e.g., 2 consecutive "know" marks).
- Search scope (term-only vs. term+description+translation) still needs a convergence decision; this document treats it as in-scope for the navigation-model discussion but the exact fields are a specification-level detail.
- If the creator's real usage skews heavily toward desktop instead of mobile, the swipe-gesture investment (Alternative recommendation for interaction model) delivers less value than assumed — worth revisiting after a few real sessions.

---

## Problem Reframing

### Research Question
How should Skill Flip be built — across tech stack, learn-mode algorithm, and interaction design — so that it is genuinely useful for real repeated study *and* reads as a polished, recruiter-facing portfolio piece, without over-engineering any single part?

### How Might We Questions
1. How might we choose a tech stack that demonstrates frontend craft to recruiters without adding maintenance burden disproportionate to a ~150-term static content app?
2. How might we make "don't-know" cards resurface noticeably more often in Learn Mode without building (or appearing to have built) a full spaced-repetition scheduler?
3. How might we design a card/navigation model that feels satisfying and mobile-native (flip, swipe) while still supporting filter/search/learn-mode as first-class, discoverable surfaces?
4. How might we treat the AI-assisted content-generation pass as a documented, trustworthy pipeline rather than an invisible one-time hack — given that content quality is equally important to the portfolio goal as the app itself?

---

## Decision Area 1: Tech Stack

### Alternative 1A: Vanilla HTML/CSS/JS, zero build step
Plain `index.html`, hand-written modular JS (ES modules via `<script type="module">`), CSS with custom properties for theming, `fetch()` of `data/glossary.json` at runtime. No `package.json`, no bundler, no npm install step for a visitor to even view source.

- **Strengths**: Absolute lowest barrier to entry — a recruiter can open the repo and read every line without knowing any tooling; deploys to GitHub Pages by pointing at the repo root, no CI build step needed; zero dependency-rot risk (nothing to go stale in 2 years); matches the user's own stated "default lean."
- **Weaknesses**: No type checking against the `glossary.json` schema (a typo'd `category` field fails silently at runtime); CSS/JS organization relies entirely on developer discipline (multiple files via native ES modules works but lacks tooling like path aliases, minification, or dev-server hot reload); "just vanilla JS" reads as competent but not distinctive — for a portfolio piece meant to show "frontend craft," it under-sells relative to the effort actually going into the visual/interaction design.
- **Best when**: The primary goal is fastest possible time-to-deploy and the recruiter audience is expected to specifically value minimalism/no-dependencies as the "craft" signal (e.g., applying to roles that prize simplicity or embedded/no-framework environments).
- **Evidence links**: Directly matches the user's Option A framing in `Skill Flip.md` ("zero dependencies, simplest deploy... user's default lean"); constraint #6 in problem-statement.md explicitly leaves this open rather than ruling it out.

### Alternative 1B: Vite + vanilla TypeScript (no UI framework)
Vite as the dev server/bundler, TypeScript for the glossary data model and app logic, native DOM APIs (no React/Vue/Svelte). CSS via plain files or Vite's built-in CSS-modules support. Ships as static assets to GitHub Pages via `vite build` + a GitHub Actions deploy workflow.

- **Strengths**: Recruiter-visible signal of modern tooling literacy (Vite config, TS types, `npm run dev`/`build` scripts) without the added conceptual overhead of a component framework; TypeScript interfaces for `GlossaryEntry { term, description, category, level, translation }` give compile-time safety against malformed content — valuable given ~150 hand-curated JSON entries where a schema typo is easy to miss; Vite's HMR meaningfully speeds up iterative UI/CSS work during the polish phase; GitHub Actions build step is itself a small, demonstrable DevOps artifact (ties back to the DevOps category in the very lexicon being studied — a nice recruiter-facing wink).
- **Weaknesses**: Adds `node_modules`/npm as a prerequisite for anyone wanting to run the project locally (mitigated by a clear README "getting started"); introduces a build step between source and deployed artifact, which is one more thing that can break in CI; slightly more initial setup time than Alternative 1A.
- **Best when**: The recruiter/portfolio goal is weighted at least as heavily as raw simplicity, and the creator is comfortable maintaining a small, standard toolchain (which the persona — a backend/Java engineer — should be, since Vite's config surface is small relative to webpack-era tooling).
- **Evidence links**: Directly matches the user's Option B framing; problem-statement.md's success criterion "recruiter-readable codebase" and "demo-able as a strong first impression" both favor a setup that shows some deliberate tooling choice, not just default absence of one; design-context.md notes both goals (study tool + portfolio) are "equal priority."

### Alternative 1C: Lightweight framework (Svelte or Preact) via Vite
Adds a minimal reactive UI framework on top of Vite — Svelte (compiles away, near-zero runtime) or Preact (3kb React-compatible API) — to manage card state, filters, and learn-mode reactivity declaratively.

- **Strengths**: Component-based structure (`Card.svelte`, `FilterBar.svelte`, `LearnMode.svelte`) reads as more "modern frontend" to a recruiter skimming file names; reactive state (e.g., current card index, filter selections) is less error-prone than manual DOM manipulation once the app has several interacting UI surfaces (filter + search + learn mode + flip animation all touching shared state).
- **Weaknesses**: For a ~150-entry static dataset with a handful of views, a framework is more tooling than the problem needs — risks reading as over-engineered rather than impressive to a technically sharp reviewer, who may wonder "why does a flashcard app need a framework?"; adds a learning-surface/dependency the creator (a backend engineer, not primarily a frontend one) must maintain correctly to keep the portfolio-code-quality bar high; increases bundle size and cognitive overhead relative to the actual UI complexity.
- **Best when**: The app's interaction surface were expected to grow substantially beyond flip/filter/search/learn (e.g., user accounts, multiple content types, complex cross-view state) — which is explicitly not the case here per the fixed constraint list.
- **Evidence links**: Contradicted by the "no over-engineering" spirit implied by the explicit learn-mode non-goal ("not a full spaced-repetition scheduler") — same philosophy applies to stack choice; problem-statement.md constraint list has no requirement that implies framework-level state complexity.

### Alternative 1D: Static-site generator (11ty/Astro) for content + vanilla JS islands for interactivity
Use an SSG to pre-render card markup from `glossary.json` at build time (better initial load, SEO-friendly if ever indexed), with small vanilla/Alpine.js scripts hydrating interactivity (flip, filter, learn mode) client-side.

- **Strengths**: Fast initial paint (all 150 cards pre-rendered as HTML, not client-fetched+rendered); plausible "I understand SSG vs SPA trade-offs" signal to recruiters; Astro's islands architecture is a legitimately modern pattern.
- **Weaknesses**: Meaningful overkill for a single-page, client-only tool with no SEO requirement (nobody is Googling individual flashcards) and no multi-page content — the entire justification for an SSG (build-time page generation, routing, content collections) doesn't apply when the "content" is one JSON file consumed by one interactive view; adds a second learning curve (SSG templating conventions) on top of the interactivity layer; deployment story is only marginally different from Vite for this use case, for meaningfully more setup.
- **Best when**: The site had many distinct pages/routes (e.g., a blog-style write-up per category, or SEO-driven discovery) — not the case here; the app is fundamentally one interactive view with three modes (browse/filter/learn), not a multi-page content site.
- **Evidence links**: No constraint or success criterion calls for multi-page structure or SEO; contradicts the "client-only, static site" framing which the user intends as "simple SPA," per design-context.md.

**Recommendation for this decision area: Alternative 1B (Vite + vanilla TypeScript, no framework).**

---

## Decision Area 2: Learn-Mode Weighting Algorithm

### Alternative 2A: Binary in/out filtering (baseline, explicitly rejected by user)
Cards marked "know" are removed from the active learn-mode rotation entirely; only "don't know" and unseen cards are shown, in random order, until the pool is empty.

- **Strengths**: Trivial to implement and explain in one sentence; guarantees zero repetition of mastered content.
- **Weaknesses**: Explicitly ruled out by the user ("not simple binary in/out"); a card marked "know" by accident (fat-finger, mobile tap) disappears from rotation with no correction path short of a full reset; provides no reinforcement of already-learned material, which contradicts how vocabulary retention actually works.
- **Best when**: N/A — included only to establish the baseline the user already rejected.
- **Evidence links**: problem-statement.md Key Decision explicitly states "not simple binary in/out filtering."

### Alternative 2B: Bucketed weighted-random draw (recommended)
Maintain three buckets per card in localStorage: `unseen`, `know`, `dont_know`. Each Learn Mode draw picks from a weighted pool, e.g., `dont_know` cards get weight 4, `unseen` weight 2, `know` weight 1 (tunable constants documented in code/README). A card moves `dont_know → know` after N consecutive "know" marks (e.g., N=2) to avoid single-tap misclassification; moves `know → dont_know` immediately on any "don't know" mark (a single miss should surface it more, not wait).

- **Strengths**: Directly implements "don't-know cards appear more often" with an outcome a user can feel and a rule a reader can explain in two sentences — no probability theory, no interval math; buckets are simple enough to display as a progress readout ("38 mastered, 12 shaky, 100 unseen") which doubles as a satisfying progress UI; tunable weights are a natural place for a small "difficulty" knob later without redesigning the data model; recovers gracefully from mis-taps via the N-consecutive-know threshold.
- **Weaknesses**: Fixed weights are a blunt instrument — a card marked "don't know" 10 times in a row gets the same boosted odds as one marked "don't know" once; requires deciding and documenting the graduation threshold N (a small but real design decision, flagged as an open question above).
- **Best when**: The goal is "noticeably smarter than random, honestly simpler than SRS" — exactly the stated success criterion.
- **Evidence links**: Directly matches problem-statement.md's "lightweight weighted resurfacing... not full Anki-style scheduling" framing and the success criterion "feels smart, not gimmicky... without the complexity of a full spaced-repetition scheduler."

### Alternative 2C: Decaying-weight / streak-based scoring
Each card carries a running numeric score (e.g., starts at 0; +1 per "know," -2 per "don't know", floor/ceiling applied). Draw probability is inversely proportional to score (lower score = more likely to be drawn), continuously rather than in discrete buckets.

- **Strengths**: More granular than fixed buckets — genuinely distinguishes "shaky twice" from "shaky once"; still far short of full SRS (no time-based intervals, no per-card scheduling dates).
- **Weaknesses**: Harder to explain simply in a README or to reason about while coding ("why did this card get drawn twice in a row?" requires understanding the score curve, not just a bucket label); harder to expose as a friendly progress UI (a continuous score doesn't map to a clean "X mastered / Y shaky" readout the way discrete buckets do); more edge cases to tune (floor/ceiling values, decay rate) for marginal benefit over 2B given the small (~150-card) dataset size where discrete buckets are already granular enough.
- **Best when**: The card set were large enough (thousands+) that discrete buckets would feel coarse, or the creator specifically wanted a "difficulty score" surfaced per card — neither applies here.
- **Evidence links**: Sits closer to the "full spaced-repetition" end of the spectrum the user explicitly wanted to avoid; problem-statement.md open-risk note flags exactly this over-engineering risk ("risk of over-engineering into a full spaced-repetition system if not scoped carefully").

### Alternative 2D: Simplified SM-2-lite (interval-based, no dates)
Borrow the core idea of SRS (increasing review interval on success, reset on failure) but implement it as "review position offset" within a single session's shuffled deck rather than real calendar-day scheduling — e.g., a "don't know" card gets re-inserted 3-5 cards ahead in the current shuffled queue instead of just being weighted for the next random draw.

- **Strengths**: Guarantees a missed card resurfaces within the *same* session, which straight weighted-random (2B) technically doesn't guarantee (a low-probability card could theoretically not reappear in a short 5-10 minute session); still no calendar/date logic, so it avoids full SRS complexity.
- **Weaknesses**: Requires modeling an explicit ordered queue with insertions rather than a stateless weighted draw — meaningfully more implementation complexity than 2B for a benefit (in-session guaranteed resurfacing) that matters less given the Creator's stated pattern is frequent short sessions across days, where cross-session weighting (2B) already accumulates pressure on weak cards; conflates "session queue" and "long-term mastery tracking" in one mechanism, muddying the mental model.
- **Best when**: Sessions were long enough (30+ min) that "resurfacing within this session" materially matters — but the Creator's actual pattern is 5-10 minutes, where cross-session persistence (which 2B already provides via localStorage) matters more than intra-session guarantees.
- **Evidence links**: personas.md's Creator journey describes 5-10 minute bursts "several times a week" — favors a mechanism whose benefit compounds across sessions (2B) over one whose benefit is mostly intra-session (2D).

**Recommendation for this decision area: Alternative 2B (bucketed weighted-random draw), with the graduation threshold (N consecutive "know" marks) to be pinned in specification.**

---

## Decision Area 3: Card / Flip Interaction & Navigation Model

### Alternative 3A: Single-card-with-controls (recommended)
One card visible at a time, centered, large tap target. Explicit controls: tap/click the card to flip, Prev/Next buttons (or arrow keys on desktop) to navigate, with swipe-left/right gestures layered on top as an accelerator for mobile (not a replacement for the buttons). Filter bar and search live above the card in a persistent header; Learn Mode is a distinct top-level mode/tab that reuses the same single-card component with the weighted draw feeding "Next."

- **Strengths**: One shared component serves Browse, Filter/Search results, and Learn Mode — least code duplication, easiest to keep visually consistent (important for the "polished" portfolio goal); button controls give explicit, discoverable affordances for the Recruiter persona who "tries a filter/search without reading instructions" — a swipe-only interface risks a first-time visitor not realizing interaction is even possible; swipe gestures layered on top serve the Creator's actual mobile usage pattern without being load-bearing (graceful degradation to buttons on desktop or if gesture detection misfires); large single-card layout is naturally mobile-first and touch-friendly per the stated constraint.
- **Weaknesses**: Less immediately "impressive" in a screenshot than a fanned card-stack; swipe-and-buttons-both means slightly more interaction-state logic (debouncing so a swipe doesn't also trigger a flip-tap) than a swipe-only design.
- **Best when**: The same navigation surface must serve multiple modes (all-cards browse, filtered subset, learn-mode weighted queue) with consistent, discoverable interaction — exactly this project's requirement per constraint #2 (filter/search) and the learn-mode requirement.
- **Evidence links**: Constraint #4 ("mobile-first... touch-friendly interactions (flip, swipe) are a primary design target") explicitly names both flip and swipe, without mandating swipe as the *only* input; personas.md Recruiter journey needs immediate, guessable interaction ("tries a filter/search without reading instructions").

### Alternative 3B: Swipeable card stack (Tinder-style)
Cards rendered as a physical stack; swipe right = "know," swipe left = "don't know," with the flip happening via tap before swiping. Only the top card of the stack is interactive; the next card is peeked behind it.

- **Strengths**: Visually the most polished/native-feeling on mobile — a stack with physics-based swipe animation is a strong, memorable "wow" moment for a recruiter's first few seconds, directly serving the "strong first impression" success criterion; swipe direction mapping to know/don't-know is intuitive and fast for the Creator's real repeated-use pattern once learned.
- **Weaknesses**: Overloads swipe with two different meanings depending on mode (in Browse/Filter mode, what does swiping even do — navigate, or nothing?) unless the whole app is redesigned around the stack metaphor, which conflicts with Filter/Search needing a list-like or grid-like results view; keyboard/desktop parity is awkward (recruiters on desktop are a real, stated audience — "arrives via a CV/LinkedIn/GitHub link" doesn't imply mobile); harder to make accessible (screen readers, keyboard-only navigation) without substantial extra work; couples the "mark know/don't-know" action to the same gesture as "move to next card," which removes the ability to browse without recording a learn-mode judgment — a problem for the "browse/filter outside learn mode" journey step in personas.md.
- **Best when**: The entire app were learn-mode-only with no separate browse/filter/search surface — not the case here, since filter/search is an equally-weighted core requirement.
- **Evidence links**: personas.md Creator journey explicitly separates "flips through cards in Learn Mode" from "occasionally browses/filters by category outside learn mode" — two distinct interaction intents that a single swipe-stack metaphor conflates.

### Alternative 3C: Grid of flippable cards (all/filtered results as a responsive grid)
Filter/search results render as a CSS grid of card-back "tiles" (term only); tapping/clicking any tile flips it in place to reveal the description. Learn Mode either reuses this grid (highlighting the "focus" card) or switches to a simplified single-card view.

- **Strengths**: Great for the Browse/Filter/Search surface specifically — lets the Recruiter see "many cards at once," which visually communicates the full ~150-term coverage and category breadth faster than paging through one at a time (a good first-impression device for demonstrating scope); natural responsive layout (1 column mobile, 3-4 columns desktop) needs no custom navigation logic — the browser's own scroll handles "next."
- **Weaknesses**: Poor fit for Learn Mode itself — the entire value of Learn Mode is focused, one-at-a-time review with a clear sense of progress ("card 6 of 20 today"); a grid diffuses that focus and makes weighted resurfacing hard to present meaningfully (what does it mean for a "don't-know" tile to be "more likely" in a grid where everything is visible at once?); requires building and maintaining two distinct navigation paradigms (grid for browse, something else for learn) rather than one shared component — more code, more inconsistency risk, cutting against the "recruiter-readable codebase" simplicity goal.
- **Best when**: The primary use case were reference lookup (like a dictionary/glossary you scan), not active recall practice — true for a slice of the Creator's journey ("browses/filters... to look something up directly") but not for Learn Mode, which is the higher-stakes, more frequently used surface.
- **Evidence links**: personas.md distinguishes the "look something up directly" browse journey from the Learn Mode journey — suggesting the grid pattern is a legitimate fit for browse/search results specifically, but not as the primary model for the whole app.

**Recommendation for this decision area: Alternative 3A (single-card-with-controls, swipe layered on top) as the primary/shared model for Learn Mode and single-card focus, with a lightweight combination borrowing from 3C for the Browse/Filter/Search results view specifically** (see Deferred/Combination note below — this is a legitimate hybrid, not scope creep, since both surfaces are already required by existing constraints).

---

## Decision Area 4: AI Content-Generation Pipeline Packaging

### Alternative 4A: Undocumented one-off (generate once, ship the JSON, no trace of process)
Run the AI-assisted generation pass once locally, hand-edit the output, commit only the final `data/glossary.json`. No prompt, no rubric, no script checked into the repo.

- **Strengths**: Fastest to ship; keeps the repo focused purely on the app, not the authoring process.
- **Weaknesses**: A curious recruiter/technical reviewer exploring "how was this content made" (a natural question for a lexicon app) finds nothing; if the creator wants to add the remaining categories later or regenerate/improve entries, the exact approach has to be reconstructed from memory; misses a legitimate opportunity to demonstrate a second skill (prompt engineering / content pipeline design) alongside the frontend work — directly relevant to a "Senior" engineering portfolio given "AI-assisted workflows" is itself a modern engineering competency.
- **Best when**: Time is extremely constrained and the content pipeline truly is a throwaway, never-repeated step — weak fit here given 12 categories × curation-per-category is realistically an iterative, multi-session effort per problem-statement.md's own open risk ("full category coverage... is a larger content-authoring effort than the app-building effort itself").
- **Evidence links**: Contradicts the "recruiter-readable codebase" and "portfolio-quality README" success criteria, which imply process transparency is part of the artifact's value, not just the running app.

### Alternative 4B: Documented pipeline as a repo artifact (recommended)
Check in a `content/` (or `scripts/`) folder containing: the generation prompt template (with the Engineering Ladder bullet format as input and the `glossary.json` schema as output contract), a short rubric for what makes a good curated entry (e.g., "definition in your own words, 1-2 sentences, no verbatim ladder text"), and a small Node/TS validation script (`npm run validate-glossary`) that checks every entry against the schema (required fields present, `level` is one of the allowed enum values, no duplicate terms, category is one of the 12) before it's considered shippable.

- **Strengths**: Directly demonstrates the "curated, not transcribed" quality bar the user set as a Key Decision — showing the rubric proves the curation actually happened by a legible standard, not just by claim; the validation script is a small, real piece of tooling craft that a recruiter skimming the repo will notice and that catches real content bugs (a typo'd `level` value silently breaking the filter UI is a very plausible bug in a 150-entry hand/AI-curated dataset); the prompt template is reusable if the creator wants to add more categories or refresh entries later; cleanly separates "one-time authoring tooling" from "runtime app code," satisfying the open risk noted in design-context.md ("needs a clear boundary... between how content gets authored and how the app consumes glossary.json").
- **Weaknesses**: Extra authoring time to write the rubric and validation script rather than just hand-editing JSON directly; a slight risk of the validation tooling itself becoming over-engineered if scope isn't capped (e.g., resist the urge to build a full CLI content-management app — a single validation script is enough).
- **Best when**: The content-authoring process is itself worth showcasing (true here — 12-category curation from ability-statements into glossary-quality definitions is nontrivial work) and there's a realistic chance of expanding/revisiting content later (also true, since full coverage is called out as a larger effort than the app itself).
- **Evidence links**: design-context.md Implication #1 ("Content pipeline is a first-class concern... spec needs a clear answer for who writes the description field and in what voice"); problem-statement.md Key Decision on AI-assisted generation + creator review.

### Alternative 4C: Fully manual curation, no AI assist documented or otherwise
Skip AI-assisted generation entirely; the creator hand-writes all ~150 definitions directly from the Engineering Ladder bullets.

- **Strengths**: No ambiguity about authorship/voice; avoids any "AI-generated content" perception risk with a skeptical technical reviewer.
- **Weaknesses**: Directly contradicts the explicit, already-made Key Decision in problem-statement.md ("Content will be curated & rewritten... via an AI-assisted generation pass"); substantially higher authoring time for equivalent quality, working against realistic completion of full 12-category coverage — a stated hard success criterion.
- **Best when**: N/A for this project — included to confirm the already-decided direction is still evidence-backed, not to seriously propose reversing it.
- **Evidence links**: problem-statement.md explicitly states this decision is already made; listed here only per the "even when research points to one clear solution, generate alternatives to validate it" rule.

**Recommendation for this decision area: Alternative 4B (documented pipeline as a repo artifact).**

---

## Trade-Off Analysis

| Alternative | Technical Feasibility | User Impact | Simplicity | Risk | Scalability |
|---|---|---|---|---|---|
| **1A** Vanilla HTML/CSS/JS | High — trivial to implement | Medium — works fine, less "wow" | Highest | Low (nothing to break) | Low (manual file wiring caps growth) |
| **1B** Vite + vanilla TS (recommended) | High — standard, well-documented tooling | High — fast dev loop, type-safe content | High | Low-Medium (build step can break, but Vite is mature) | Medium-High (TS types + modules scale with content growth) |
| **1C** Svelte/Preact + Vite | Medium — more moving parts | Medium — no visible end-user benefit | Medium-Low | Medium (framework version churn, over-fit risk) | High (best for growing UI complexity — not needed here) |
| **1D** SSG + islands | Medium — right tool, wrong job | Low — no benefit for single-view SPA | Low | Medium (two paradigms to maintain) | Medium (scales for multi-page, irrelevant here) |
| **2A** Binary in/out | High | Low — explicitly rejected by user | Highest | Low | Low (no nuance as content grows) |
| **2B** Bucketed weighted draw (recommended) | High — simple state machine | High — noticeably smarter, explainable | High | Low | High (buckets scale cleanly to more content/categories) |
| **2C** Decaying/streak score | Medium — more tuning required | Medium — marginal gain over 2B at this scale | Medium | Medium (tuning/edge-case risk) | Medium (better at scale, but 150 cards doesn't need it) |
| **2D** Session-queue reinsertion | Medium — queue mutation logic | Medium — helps only within-session | Medium | Medium (queue-state bugs) | Medium |
| **3A** Single-card + controls (recommended) | High | High — discoverable + serves all 3 modes | High | Low | High (same component scales to more categories/filters) |
| **3B** Swipeable stack | Medium — gesture/physics work | High on mobile, poor on desktop | Medium | Medium (accessibility, mode-conflation risk) | Low-Medium (hard to extend to filter/search) |
| **3C** Grid of flippable cards | High for browse; poor for learn | High for scanning/coverage impression, poor for focused review | Medium (two paradigms if used everywhere) | Low-Medium | High for content growth (grid handles more items easily) |
| **4A** Undocumented pipeline | High (least work) | Low — invisible to reviewer | Highest | Medium (process loss over time) | Low (nothing reusable) |
| **4B** Documented pipeline (recommended) | High | High — visible craft signal + catches data bugs | Medium-High | Low | High (reusable for future categories/content refresh) |
| **4C** Fully manual, no AI | Medium (slow) | Medium | High | Medium (misses stated deadline pressure / coverage risk) | Low |

**Perspective notes**:
- **Technical feasibility** favors the recommended options across the board — none require exotic technology, all are well-trodden patterns.
- **User impact** was evaluated separately for the two personas: the Creator values low-friction, resumable, honestly-adaptive Learn Mode (favors 1B/2B/3A); the Recruiter values instant legibility and a strong first few seconds (favors 1B, 3A's discoverability, 3C's scannability for the browse surface, and 4B's visible process craft).
- **Simplicity** is the strongest pull toward 1A/2A in isolation, but both lose out once weighed against explicit user decisions and success criteria that call for more than the simplest possible baseline.
- **Risk** is low across all recommended options — this reflects a genuinely low-risk problem space (static content app, no backend, no user data beyond local prefs) rather than the recommendations being conservative for its own sake.
- **Scalability** matters less than usual here (content is capped at ~150 terms, no user growth), but still favors options (1B, 2B, 3A, 4B) that would gracefully absorb "add a 13th category later" without a rewrite.

---

## User Preferences

No live user-dialogue preferences were supplied to this phase (alternatives are generated purely from evidence per this agent's scope). The following stated constraints and decisions from prior phases function as binding preferences, not open trade-offs:
- Client-only static site, deployable to GitHub Pages (non-negotiable).
- `data/glossary.json` schema with `term`, `description`, `category`, `level`, translation field (non-negotiable).
- Mobile-first, touch-friendly, flip + swipe named explicitly (non-negotiable design target, though not mandating swipe-only).
- Learn Mode must be "weighted, not binary, not full SRS" (non-negotiable, already narrows Decision Area 2 to bucketed/streak/session-queue style options).
- Visual identity from the AiB Projekt avatar palette (non-negotiable, orthogonal to the alternatives above — applies as a styling layer regardless of stack/interaction choice).
- Both personas (Creator, Recruiter) are equal priority — no alternative above may be recommended solely on the strength of one persona's benefit without checking the other.

---

## Recommended Approach

**Tech stack**: Vite + vanilla TypeScript, no UI framework (Alternative 1B).
**Learn-mode algorithm**: Bucketed weighted-random draw with a consecutive-know graduation rule (Alternative 2B).
**Interaction model**: Single-card-with-controls as the shared primary component (swipe layered on top for mobile), combined with a lightweight grid view specifically for Browse/Filter/Search results (Alternative 3A, informed by 3C for the non-learn-mode surface).
**Content pipeline**: Documented, checked-in generation prompt + rubric + validation script (Alternative 4B).

**Primary rationale**: Each recommendation sits at the same point on its own spectrum — meaningfully more considered than the "default minimal" option, but deliberately short of the "maximal/impressive-looking" option that would risk over-engineering relative to this app's actual scope (~150 static entries, three interaction modes, no backend, no multi-user concerns). This consistency matters because the two personas' success criteria pull in complementary rather than opposite directions once the scope is right-sized: a recruiter evaluating engineering judgment is at least as impressed by a well-reasoned, right-sized architecture as by maximal visual flash, and the Creator's actual usage pattern (short, frequent mobile sessions) is best served by predictable, low-friction interactions rather than novelty.

**Key trade-offs accepted**:
- Choosing Vite over vanilla JS accepts a build-tool dependency (npm/node) in exchange for type safety and a more demonstrable toolchain.
- Choosing bucketed weighting over decaying/streak scoring accepts coarser granularity in exchange for explainability and lower implementation risk — appropriate given the ~150-card scale.
- Choosing single-card-with-controls over a swipe-only stack accepts a slightly less flashy first-glance demo in exchange for one shared, robust component across all three modes and full desktop/accessibility parity.
- Choosing a documented content pipeline over a quiet one-off accepts extra authoring overhead in exchange for a second, visible craft artifact and future reusability.

**Key assumptions** (if wrong, revisit):
1. The creator is comfortable with a small Node/npm toolchain as a backend engineer — if this project is meant to also showcase "I can ship without any JS tooling at all," Alternative 1A becomes more attractive.
2. The ~150-card dataset size stays roughly fixed — if it were to grow 5-10x, decaying-weight scoring (2C) or true SRS would earn back the complexity cost.
3. Real usage skews mobile as described in personas.md — if desktop review turns out to dominate, the swipe-gesture investment in 3A delivers less relative value (though the button controls still work fine either way).
4. The creator will actually maintain and reuse the content pipeline (4B) rather than running it once and abandoning it — if content truly is one-and-done, 4A's lower overhead becomes more justifiable, though the visible-craft argument for 4B still holds for the portfolio goal.

**Confidence**: High for Decision Areas 1, 2, and 4 (strong, direct evidence from explicit constraints and success criteria). Medium-High for Decision Area 3 (the single-card + grid-hybrid combination is a reasoned synthesis rather than a single clean-cut alternative — specification-creator should pin down exactly how the grid view and single-card view share state/transition between each other).

---

## Why Not Others

- **1A (Vanilla HTML/CSS/JS)**: Rejected as primary recommendation only because the portfolio goal is equally weighted with the study-tool goal, and 1B achieves nearly the same simplicity with added type-safety and a more visible-craft toolchain at low additional cost. Still a fully legitimate choice if the creator prioritizes absolute zero-dependency purity.
- **1C (Svelte/Preact)**: Rejected as introducing framework overhead disproportionate to the app's actual UI complexity (3 modes, ~150 static records, no complex cross-cutting state) — risks reading as over-engineered to a sharp technical reviewer.
- **1D (SSG + islands)**: Rejected as solving problems (multi-page routing, SEO, build-time content collections) this project doesn't have.
- **2A (Binary in/out)**: Rejected outright — explicitly ruled out by the user's own stated requirement.
- **2C (Decaying/streak score)**: Rejected as adding tuning complexity and losing the clean "X mastered / Y shaky" progress readout, for a granularity benefit that doesn't matter at ~150 cards.
- **2D (Session-queue reinsertion)**: Rejected as solving for intra-session resurfacing guarantees when the Creator's actual usage pattern (frequent short sessions across days) benefits more from cross-session persistent weighting, which 2B already provides.
- **3B (Swipeable stack)**: Rejected as the primary/sole model because it conflates "mark know/don't-know" with "navigate," which breaks the stated need to browse/filter without recording a learn-mode judgment, and because it doesn't gracefully serve desktop visitors or the filter/search results surface.
- **3C (Grid of flippable cards) as sole model**: Rejected as a poor fit for focused Learn Mode review, though retained as a good fit specifically for the Browse/Filter/Search results surface (folded into the recommendation as a hybrid, not a rejected alternative).
- **4A (Undocumented pipeline)**: Rejected as forfeiting a visible craft-and-process signal that costs relatively little to produce and directly supports the "recruiter-readable" and "portfolio-quality" success criteria.
- **4C (Fully manual, no AI)**: Rejected as contradicting an already-made Key Decision and working against the full-12-category-coverage success criterion under realistic time constraints.

---

## Deferred Ideas

- **Cloud sync / account system** for cross-device learn-mode progress — explicitly out of scope per constraint #7 ("No cross-device sync... accepted limitation, not a gap to solve"). Noted here only to confirm it was considered and intentionally deferred, not overlooked.
- **Spaced-repetition-proper mode as an opt-in "advanced" toggle** (i.e., offering both the lightweight bucketed mode and a true SM-2 style scheduler as a user preference) — a plausible future enhancement once the lightweight version has been used in practice long enough to know if it's insufficient, but adding it now would be solving a problem not yet observed to exist. Deferred.
- **Multi-language support beyond EN/PL** (e.g., a third language, or a full i18n framework for UI chrome, not just term translation) — no evidence this is needed; the current PL-translation field is a data requirement, not a UI localization requirement. Deferred.
- **Public content-contribution workflow** (e.g., accepting community-submitted glossary entries via PR, with automated validation-script gating) — a natural extension of the Alternative 4B validation script, but the current problem statement frames this as a personal tool with a portfolio side-effect, not a community project. Worth revisiting only if the repo gains external contributor interest post-launch. Deferred.
- **Analytics/telemetry on which terms are hardest across a hypothetical multi-user base** — irrelevant given the single-user, localStorage-only design; would require the cross-device sync capability that is explicitly out of scope. Deferred.

No out-of-scope ideas were incorporated into the alternatives above; all four explored decision areas map directly to constraints or open questions already present in `problem-statement.md` and `design-context.md`.
