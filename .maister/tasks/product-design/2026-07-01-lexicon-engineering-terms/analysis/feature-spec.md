# Feature Specification: Skill Flip — Engineering Lexicon

## TL;DR
A Vite + vanilla TypeScript, client-only flashcard app for reviewing curated Java/Backend engineering terms, data-driven from a typed `data/glossary.json`. One shared single-card component (tap-to-flip, Prev/Next, swipe accelerators, separate translation toggle) serves Learn Mode and focused review; a flippable grid serves Browse/Filter/Search. Learn Mode uses a bucketed weighted-random draw (dont_know weighted 4x, graduates after 2 consecutive "know" marks) persisted in `localStorage`. Visual identity uses a CSS-variable palette derived from the AiB Projekt GitHub avatar plus one added terracotta accent. Content is authored via a documented, checked-in AI-generation pipeline (prompt template + rubric + validation script) kept separate from runtime code. Ships via GitHub Actions to GitHub Pages; README serves both the creator and recruiter audiences. 8 sections, all implementation-ready and depth-verified.

## Key Decisions
- `GlossaryEntry` schema fixed: `id`, `term`, `description`, `translationPl`, `descriptionPl`, `category` (12-value enum), `level` (Junior/Regular/Senior) — enforced by a validation script, not at runtime. Polish translation covers BOTH the term and the full definition (revised during mockup review — originally specced as term-only). (Section 1)
- Single shared card component handles flip, navigation, and swipe; the full Polish translation (term + definition) is hidden behind a separate "(i)" toggle rather than always shown on the back, keeping the English definition primary. (Section 2, revised twice: once for the toggle itself, once to cover the full definition)
- Search matches term + description + Polish translation + Polish definition; grid tiles flip in place rather than navigating away. Filter/search state is intentionally NOT persisted across sessions. (Section 3)
- Learn Mode: bucketed weighted-random draw, weights `dont_know=4 / unseen=2 / know=1`, graduation after 2 consecutive "know" marks, immediate demotion on any miss — no explicit session concept, always resumable. (Section 4)
- Visual palette is CSS custom properties derived from the AiB Projekt avatar, plus one deliberate non-avatar addition (muted terracotta) for the "don't know" accent, since the avatar itself has no warning/attention color. (Section 5, flagged and approved)
- Content pipeline (prompt template + rubric + validation script) is checked into the repo under `content-pipeline/`, explicitly separated from the shipped app's runtime code. (Section 6)
- Vite + GitHub Actions deploy to GitHub Pages; no environment variables/secrets needed (fully static). (Section 7)
- README is a dual-audience artifact (creator's future reference + recruiter skim), with explicit "adding new glossary entries" instructions covering both manual edits and the content pipeline. (Section 8)

## Open Questions / Risks
- Exact per-category → badge-color assignment is left as an implementation detail (any consistent, accessible-contrast mapping satisfies the spec).
- The terracotta "don't know" accent color is a deliberate addition beyond the avatar-derived palette — flagged for awareness, already approved.
- No special UI exists for "100% mastered" (full-mastery edge case) beyond the draw algorithm continuing to function — a celebratory banner is a nice-to-have, not required for v1.
- License choice for the README is left to the creator, not specified here.

---

## Section 1: Data Model & Content Schema

```typescript
// src/types/glossary.ts

export type Level = "Junior" | "Regular" | "Senior";

export type Category =
  | "Soft Skills"
  | "Management"
  | "Mentoring"
  | "Problem Solving"
  | "API Development"
  | "Cloud Engineering"
  | "Data Storage"
  | "DevOps"
  | "Java"
  | "Software Engineering"
  | "Spring/JEE"
  | "Testing";

export interface GlossaryEntry {
  id: string;              // stable slug, e.g. "idempotency" — used as localStorage key, must be unique
  term: string;             // English term, e.g. "Idempotency"
  description: string;      // curated definition, 1-3 sentences, English
  translationPl: string;    // Polish translation of the term itself, e.g. "Idempotentność"
  descriptionPl: string;    // Polish translation of the full definition, 1-3 sentences
  category: Category;
  level: Level;
}

export type Glossary = GlossaryEntry[];
```

**File**: `data/glossary.json` — a plain JSON array matching `GlossaryEntry[]`, fetched at runtime via `fetch('./data/glossary.json')` (no bundling into JS, so the content can be edited without a rebuild — see Section 6 on why a validate step is still recommended even so).

**Schema rules** (enforced by the validation script in Section 6, not at runtime):
- `id` must be unique, lowercase-kebab-case, stable across edits (used as the localStorage progress key — renaming an `id` resets that card's progress, an accepted, documented trade-off)
- `term`, `description`, `translationPl`, `descriptionPl` are non-empty strings
- `category` must be one of the 12 enum values above
- `level` must be one of `Junior | Regular | Senior` (Junior realistically only used for API Development per the source ladder, but the type allows any category to have Junior-level entries)
- No duplicate `(term, category)` pairs

**Runtime loading**: the app fetches `glossary.json` once on load, validates client-side that it's a non-empty array (fails loudly with a visible error state if fetch fails or the array is empty — no silent blank screen), and holds it in memory for the session. No pagination needed at ~150 entries.

**Why a flat array, not grouped-by-category**: filtering/searching is simpler over a flat list with in-memory `.filter()`; grouping by category is a derived view (computed via `.reduce()` when rendering the Browse grid), not the storage shape.

---

## Section 2: Card & Flip Interaction (Single-Card Component)

The shared component used by Learn Mode and any focused single-card view.

**Component states**:
```typescript
interface CardViewState {
  currentEntry: GlossaryEntry;
  isFlipped: boolean;          // false = showing term (front), true = showing description (back)
  direction: "next" | "prev" | null;  // drives the transition animation direction
  isTranslationVisible: boolean;      // false by default; toggled independently of isFlipped
}
```

**Interaction model**:
| Input | Action |
|---|---|
| Tap/click on card body | Toggle `isFlipped` (flip animation, ~300-400ms CSS 3D transform on a `.card-inner` wrapper: `rotateY(180deg)`) |
| Tap "Next" button / → arrow key / swipe-left | Advance to next entry in the current queue; resets `isFlipped` and `isTranslationVisible` to `false` on the new card |
| Tap "Prev" button / ← arrow key / swipe-right | Go to previous entry in queue history (a simple array-index stack, not full undo); resets `isFlipped` and `isTranslationVisible` to `false` |
| Spacebar (desktop) | Same as tap-to-flip, for keyboard-only users |
| Tap "(i)" icon (back side only) | Toggle `isTranslationVisible`; does NOT flip or navigate — a small, separate tap target so it can't be triggered by accident during a flip |
| Swipe up/down (Learn Mode only) | Mark "know" (up) / "don't know" (down) — see Section 4. Only active when `isFlipped === true`; a swipe attempted while `isFlipped === false` instead just flips the card |

**Front (term side)**: large term text, category badge (colored per Section 5 palette), level badge (Regular/Senior/Junior pill).

**Back (description side)**: term repeated (small, at top, for context), full description. Polish translation is **hidden by default** behind a small "(i)" icon button next to the term; tapping it reveals both `translationPl` (the term) and `descriptionPl` (the full translated definition) together in one expanding block/popover, without affecting flip or navigation state. This keeps the English definition as the primary focus and treats the full Polish translation as an optional, complete lookup — not a partial "just the word" translation that leaves the definition itself untranslated.

**Card queue abstraction**: the component receives an ordered array of `GlossaryEntry` (the "queue") plus an index; Browse/Filter/Search and Learn Mode each construct this queue differently (a filtered subset in list order for Browse; a weighted-random draw sequence for Learn Mode — see Section 4) but hand the same shape to the card component. This is the concrete mechanism behind the "one shared component" decision from `design-decisions.md`.

**Accessibility**: card front/back both rendered in the DOM simultaneously (back visually hidden via `backface-visibility: hidden` + rotation, not `display:none`), so screen readers can still access content; flip triggered via a real `<button>` wrapping the card (not a bare `<div onclick>`), keyboard-focusable and announced; the "(i)" translation toggle is also a real `<button>` with an `aria-label="Show Polish translation"`.

**Desktop vs. mobile parity**: buttons are always visible (not hidden behind swipe-only); swipe/keyboard are accelerators layered on top, matching the `design-decisions.md` selection.

---

## Section 3: Browse / Filter / Search

**Layout**: a persistent header (sticky on scroll) containing: search input, category filter (multi-select dropdown/chips), level filter (segmented control: All / Junior / Regular / Senior). Below the header, a responsive CSS grid of card tiles (1 column mobile, 2 columns tablet, 3-4 columns desktop).

**Filter state**:
```typescript
interface BrowseFilterState {
  searchQuery: string;               // raw input, debounced 200ms before applying
  selectedCategories: Category[];    // empty array = all categories shown
  selectedLevel: Level | "All";
}
```

**Filtering/search logic** (pure function, re-run on any state change):
```typescript
function applyFilters(glossary: GlossaryEntry[], state: BrowseFilterState): GlossaryEntry[] {
  const q = state.searchQuery.trim().toLowerCase();
  return glossary.filter(entry => {
    const categoryMatch = state.selectedCategories.length === 0
      || state.selectedCategories.includes(entry.category);
    const levelMatch = state.selectedLevel === "All" || entry.level === state.selectedLevel;
    const searchMatch = q === "" ||
      entry.term.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.translationPl.toLowerCase().includes(q) ||
      entry.descriptionPl.toLowerCase().includes(q);
    return categoryMatch && levelMatch && searchMatch;
  });
}
```
(Per the earlier convergence decision, search matches term + description + Polish translation — now covering both the Polish term and the Polish definition, since Section 1 was revised to include `descriptionPl`.)

**Grid tile (card-back-collapsed state)**: each tile shows the `term` and category/level badges by default (not flipped); tapping a tile flips it in place (in-grid, using the same flip mechanics as Section 2, sized down) to reveal the description — it does NOT navigate to a separate single-card view. This preserves the "scan many at once" value of the grid (Recruiter persona: seeing full category breadth fast) while reusing the same flip component/animation for visual consistency.

**Result count & empty state**: a small "`N` of 150 terms" counter above the grid, live-updating with filters. If filters produce zero results: a friendly empty state ("No terms match — try clearing a filter") with a "Clear filters" button, not a blank grid.

**Filter persistence**: filter/search state is NOT persisted across sessions (resets on reload) — this is a lightweight, in-session-only concern, distinct from Learn Mode's cross-session `localStorage` progress (Section 4). Rationale: browsing is exploratory and low-stakes; there's no evidence a "remember my last filter" feature is needed, and adding it would be unrequested scope.

**Category filter UI detail**: chips/checkboxes for all 12 categories, each showing a live count of matching entries in parens (e.g. "Java (14)") so filtering communicates content volume before you click — useful for the Recruiter's fast-scan need and the Creator's "look something up" journey.

**Entry point from Learn Mode**: a visible "Browse all" or "Exit Learn Mode" control always returns here without losing learn-mode progress (progress is saved continuously to `localStorage`, not just on exit — see Section 4).

---

## Section 4: Learn Mode

**Per-card learn state** (persisted in `localStorage`, keyed by `id`):
```typescript
type Bucket = "unseen" | "know" | "dont_know";

interface LearnProgressEntry {
  bucket: Bucket;
  consecutiveKnowCount: number;   // resets to 0 on any "don't know"; increments on each "know"
}

// localStorage key: "skillflip:learn-progress"
// value: Record<string, LearnProgressEntry>  — keyed by GlossaryEntry.id
```

**Bucket weights** (draw probability, tunable constants in one `config.ts` file):
```typescript
const BUCKET_WEIGHTS: Record<Bucket, number> = {
  dont_know: 4,
  unseen: 2,
  know: 1,
};
const GRADUATION_THRESHOLD = 2; // consecutive "know" marks needed to move dont_know -> know
```

**Draw algorithm** (runs once per "Next" in Learn Mode):
1. Build a weighted pool: for each card, look up its current bucket (default `unseen` if not in `localStorage` yet), repeat its `id` in a flat array `BUCKET_WEIGHTS[bucket]` times.
2. Pick one entry at random (uniform) from that flat array — this naturally gives `dont_know` cards ~4x the draw chance of `know` cards.
3. Exclude the immediately-previous card from the pool for this draw only (avoid showing the same card twice in a row) unless it's the only card left.

**Marking logic** (on swipe up = "know" / swipe down = "don't know", per Section 2):
- Mark "don't know" → `bucket = "dont_know"`, `consecutiveKnowCount = 0` (immediate, regardless of prior state — "a single miss should surface it more, not wait," per `alternatives.md`).
- Mark "know" → increment `consecutiveKnowCount`; if it reaches `GRADUATION_THRESHOLD` (2), set `bucket = "know"` and reset the counter to 0; otherwise stay in the current bucket (an `unseen` or `dont_know` card doesn't jump to `know` on a single mark).

**Session queue construction**: Learn Mode does NOT pre-build a fixed shuffled deck; each "Next" re-runs the weighted draw against current bucket state, so a card just marked "don't know" can legitimately reappear sooner within the same session — an emergent property of the weighting, not separately engineered logic (this was the key reason Alternative 2D — explicit queue reinsertion — was rejected as redundant).

**Progress UI**: a small stat readout always visible in Learn Mode header: `"{know_count} mastered · {dont_know_count} shaky · {unseen_count} new"`. Computed by counting buckets across all ~150 `LearnProgressEntry` records on each render — no separate aggregate needs to be stored.

**Reset control**: a visible "Reset progress" button (in a settings/menu area, with a confirmation prompt — "This clears all learn-mode progress. Continue?") clears the entire `localStorage` key, returning every card to `unseen`.

**Session boundaries**: there is no explicit "session" concept — Learn Mode is always live/continuous; opening the app and tapping "Learn" just resumes drawing from current bucket state. This directly serves the Creator persona's "resumes instantly, no configuration step" requirement from `personas.md`.

**Empty/edge cases**: if literally every card is in the `know` bucket (full mastery), the draw still works (weight 1 each, uniform random) — no special "you've mastered everything" dead-end state is needed, though a small celebratory banner is a nice-to-have, not required for v1.

---

## Section 5: Visual Design & Theming

**Color palette** (derived from the AiB Projekt GitHub avatar — muted painterly tones), defined as CSS custom properties:

```css
:root {
  /* Core palette from avatar */
  --color-navy: #1c2b3a;        /* dark charcoal-navy — primary text, header */
  --color-steel: #5b7086;       /* muted steel blue-gray — secondary elements, borders */
  --color-ice: #d7e2e6;         /* pale ice-blue — backgrounds, card fronts */
  --color-sage: #6f8a72;        /* muted sage green — accents, "know" state */
  --color-chartreuse: #e3e8ad;  /* pale chartreuse — highlights, badges */
  --color-cream: #f7f7f2;       /* off-white cream — page background */

  /* Semantic mapping */
  --bg-page: var(--color-cream);
  --bg-card-front: var(--color-ice);
  --bg-card-back: #ffffff;
  --text-primary: var(--color-navy);
  --text-secondary: var(--color-steel);
  --accent-know: var(--color-sage);       /* "know" marking, mastered badge */
  --accent-dont-know: #b5765f;            /* warm muted terracotta — deliberate complementary addition (not from the avatar itself) for "needs review" contrast */
  --accent-highlight: var(--color-chartreuse);
}
```

**Category color-coding**: each of the 12 categories gets a badge color assigned from a small derived sub-palette (tints/shades of the 6 core colors above) — e.g. Java=navy, Spring/JEE=steel, Cloud Engineering=sage, DevOps=chartreuse, etc. Exact per-category assignment is a design/implementation detail, not a product decision — any consistent, accessible-contrast mapping satisfies the requirement.

**Typography**: a single clean sans-serif for UI chrome (e.g. system font stack: `-apple-system, "Segoe UI", Roboto, sans-serif` — avoids a webfont load for a small app), with a monospace accent font (e.g. `"JetBrains Mono", monospace`) used sparingly for category/level badges and the progress-counter numbers, as a subtle nod to the technical subject matter without going full "code-editor theme."

**Layout breakpoints** (mobile-first, per constraint):
```css
/* Base styles = mobile (< 640px): single column, full-width card, stacked filter controls */
@media (min-width: 640px)  { /* tablet: 2-column browse grid */ }
@media (min-width: 1024px) { /* desktop: 3-4 column browse grid, side-by-side filter bar */ }
```

**Card sizing**: single-card view (Learn Mode) caps max-width at ~420px even on desktop (centered) — a flashcard shouldn't stretch edge-to-edge on a wide screen; the Browse grid, by contrast, does use full available width.

**Motion**: flip transform (~300-400ms `ease-in-out`), swipe-dismiss animation (~200ms translate + fade) — both respect `prefers-reduced-motion: reduce` (fall back to instant state changes, no animation) for accessibility.

**First-load feel**: no loading spinner needed for the ~150-entry JSON fetch (expected to complete in well under a second on any real connection), but a minimal skeleton/placeholder state is shown for the first 100-200ms to avoid a layout flash.

---

## Section 6: Content Generation Pipeline

A one-time (repeatable) authoring tool, separate from the shipped app's runtime — lives in a `content-pipeline/` folder, not bundled into the built app.

**Inputs**: `context/Engineering Ladder.md` (the source taxonomy) — copied into the repo as `content-pipeline/source/engineering-ladder.md` for traceability.

**Prompt template** (`content-pipeline/prompt-template.md`, checked into the repo verbatim so the process is reproducible):
```
You are curating flashcard glossary entries from a skills-ladder document.

For each skill bullet below, extract the core TECHNICAL TERM (not the full
ability-statement) and write a glossary-quality definition.

Rules:
- `term`: the concept name only (e.g. "Idempotency", not "Understanding of
  idempotency and safe methods")
- `description`: 1-3 sentences, written in your own words, no verbatim
  copying of the source bullet, suitable for someone reviewing the concept
  for an interview
- `translationPl`: the Polish translation of the TERM itself
- `descriptionPl`: the full definition translated into natural Polish
  (not a literal word-for-word translation — should read naturally to a
  Polish speaker)
- `category`: must be one of the 12 fixed categories [list provided]
- `level`: Junior | Regular | Senior, matching the source section
- `id`: lowercase-kebab-case slug of the term, must be unique across all
  entries

Output strictly as a JSON array matching this TypeScript type:
[paste GlossaryEntry type from Section 1]

Source bullets:
[paste category section from engineering-ladder.md]
```
Run once per category (12 runs total), outputs merged into a working `data/glossary.draft.json`.

**Curation rubric** (`content-pipeline/rubric.md`) — the creator's review checklist before promoting draft entries to `data/glossary.json`:
- Term is a real, googleable technical concept (not a vague paraphrase of the ability statement)
- Definition is accurate and reads naturally — not a copy-paste of the ladder bullet
- No two entries in the same category have near-duplicate terms
- Polish term translation (`translationPl`) is accurate and idiomatic
- Polish definition (`descriptionPl`) reads naturally, not as a stiff literal translation of the English `description`

**Validation script** (`content-pipeline/validate-glossary.ts`, run via `npm run validate-glossary`):
- Parses `data/glossary.json`, checks it against the `GlossaryEntry[]` type (via a runtime check, e.g. a small hand-written validator or a lightweight schema library)
- Fails (non-zero exit code, printed list of problems) if: any required field is empty, `category` isn't one of the 12 enum values, `level` isn't one of the 3 enum values, any `id` is duplicated, any `(term, category)` pair is duplicated
- Run manually before committing content changes; optionally wired into the GitHub Actions build (Section 7) as a pre-deploy check that fails the build on invalid content

**Boundary with runtime app**: nothing in `content-pipeline/` is imported by the app's source (`src/`) or included in the Vite build — it's a standalone Node/TS tooling folder with its own `package.json` scripts, documented in the README (Section 8) as "how content is authored," clearly separated from "how the app runs."

---

## Section 7: Project Structure, Build & Deployment

**Repo structure**:
```
skill-flip/
├── content-pipeline/
│   ├── source/engineering-ladder.md
│   ├── prompt-template.md
│   ├── rubric.md
│   └── validate-glossary.ts
├── data/
│   └── glossary.json
├── src/
│   ├── types/glossary.ts
│   ├── components/
│   │   ├── Card.ts             (Section 2)
│   │   ├── BrowseGrid.ts       (Section 3)
│   │   ├── FilterBar.ts        (Section 3)
│   │   └── LearnMode.ts        (Section 4)
│   ├── lib/
│   │   ├── filters.ts          (applyFilters, Section 3)
│   │   ├── learnAlgorithm.ts   (weighted draw, Section 4)
│   │   └── storage.ts          (localStorage read/write helpers)
│   ├── styles/theme.css        (Section 5 CSS variables)
│   └── main.ts
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .github/workflows/deploy.yml
└── README.md
```

**Vite config**: `base: '/skill-flip/'` (or the actual repo name) so asset paths resolve correctly under GitHub Pages' project-site subpath; `build.outDir: 'dist'`.

**Deployment** (`.github/workflows/deploy.yml`): triggers on push to `main`. Steps: checkout → `npm ci` → `npm run validate-glossary` (fails the build on bad content, per Section 6) → `npm run build` → deploy `dist/` to the `gh-pages` branch (or GitHub Pages' native Actions deployment, `actions/deploy-pages`). Live URL: `https://<username>.github.io/skill-flip/`.

**Local development**: `npm install` then `npm run dev` (Vite dev server with HMR) — documented as the "getting started" path in the README for anyone cloning the repo.

**No environment variables / secrets needed** — fully static, no API keys, no backend to configure.

---

## Section 8: Documentation (README)

**README.md structure** (this is itself a portfolio artifact, per the success criteria):

1. **Project title + one-line pitch** — e.g. "Skill Flip — an interactive flashcard lexicon of Senior/Regular Java & Backend engineering terms."
2. **Live demo link** (GitHub Pages URL) prominently at the top, plus a screenshot or short GIF of the flip/learn interaction (satisfies the "demo-able" success criterion for visitors who don't click through to the live link).
3. **Why this exists** — 2-3 sentences: personal study tool built from a structured Engineering Ladder taxonomy, doubling as a portfolio piece.
4. **Features list**: flip cards, category/level filtering, full-text search, weighted learn mode, EN/PL translations.
5. **Tech stack** — Vite + TypeScript, no framework, deployed via GitHub Actions to GitHub Pages.
6. **Getting started** — clone, `npm install`, `npm run dev`.
7. **Adding new glossary entries** (the explicitly requested "instructions for adding new cards"):
   - Edit `data/glossary.json` directly for a single manual entry (schema documented inline: `term`, `description`, `category`, `level`, `translationPl`), OR
   - Use the content pipeline (`content-pipeline/`) for bulk/AI-assisted additions from a new source document — link to `content-pipeline/prompt-template.md` and `rubric.md`.
   - Always run `npm run validate-glossary` before committing.
8. **Project structure** — brief annotated version of the Section 7 tree, so a reviewer can navigate the repo quickly.
9. **License** — creator's choice (e.g. MIT), not a product decision for this spec.

**Tone**: written for two audiences at once — clear enough for the creator's own future reference ("how do I add a card again?"), and polished enough to read well to a recruiter skimming it in under a minute. No filler ("This project was bootstrapped with...") — every section earns its place per the success criteria.
