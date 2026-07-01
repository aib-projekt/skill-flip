# Glossary Entry Curation Rubric

Quality bar for reviewing any `GlossaryEntry` produced via
`content-pipeline/prompt-template.md` (or written by hand) before it is
added to `data/glossary.json`. Every entry — starter set or future
additions — should be checked against every item below.

## 1. `term` is a concept name, not a bullet transcript

- ✅ `"term": "Idempotency"`
- ❌ `"term": "Understanding of idempotency and safe methods"`

The term is what a learner types into a search box or sees on the front of
a flashcard. If it reads like a sentence or an ability-statement ("Ability
to...", "Understands and able to..."), it needs to be distilled down to the
concept name.

## 2. `description` is rewritten, not transcribed

- The source taxonomy bullet tells you **what** to define — it is not
  itself a definition, and it must never be copy-pasted or lightly
  reworded into `description`.
- Read the bullet, recall/derive what the concept actually means, and
  write a fresh 1-3 sentence definition from that understanding.
- Test: if you can find the source bullet's wording (or a close paraphrase
  preserving its exact structure/clauses) inside `description`, it fails
  this check and must be rewritten.
- 1-3 sentences: long enough to actually teach the concept, short enough to
  fit a flashcard back face without a wall of text.

## 3. `translationPl` and `descriptionPl` cover the right scope

- `translationPl` translates the **term only** — a word or short noun
  phrase, not a sentence.
- `descriptionPl` translates the **entire `description`**, not just the
  term repeated in Polish and not a stub. Check: `descriptionPl` should be
  roughly the same information density as `description` — a Polish-only
  reader should learn the same thing an English-only reader learns from
  `description`.
- Translation should read as natural Polish technical writing, not a stiff
  word-for-word conversion. Prefer idiomatic phrasing a Polish engineer
  would actually use over a literal calque, as long as meaning is preserved.

## 4. Level assignment is appropriate, not just mechanically copied

- Default to the level under which the source bullet appears (Junior /
  Regular / Senior), but sanity-check: does this concept actually require
  that level of experience to use correctly, independent of where the
  source document happened to place it?
- When in doubt, prefer the source document's placement — level
  reassignment should be the exception, and any deviation should be
  double-checked against sibling terms already in `data/glossary.json` at
  that level for consistency.

## 5. Splitting compound bullets

- If a single source bullet actually names multiple distinct, separately
  flashcard-worthy concepts (e.g. "Design patterns: Adapter, Builder,
  Decorator"), curate **one `GlossaryEntry` per concept**, not one entry
  that mashes all three into a run-on `description`.
- Do not over-split: a bullet like "Understanding of idempotency and safe
  methods" is one concept (idempotency, with "safe methods" as a
  supporting detail folded into the definition), not two entries.

## 6. Schema mechanics (also enforced automatically by `validate-glossary.ts`)

- `id` is lowercase-kebab-case, stable, and unique across the whole file.
- `category` is exactly one of the 12 `Category` values in
  `src/types/glossary.ts` — check spelling/casing exactly
  (e.g. `"Spring/JEE"`, not `"Spring / JEE"` or `"spring-jee"`).
- `level` is exactly `"Junior"`, `"Regular"`, or `"Senior"`.
- No two entries share the same `id`.
- No two entries share the same `(term, category)` pair (the same term name
  is allowed to recur across different categories if genuinely distinct in
  context, but not duplicated within one category).

## 7. Final gut check before committing

Read the entry back with fresh eyes and ask: "If I only saw the front of
this flashcard (the term) and flipped it, would the back actually teach me
this concept, correctly and concisely, in English and in Polish?" If the
answer isn't a clear yes, send it back for another editing pass.
