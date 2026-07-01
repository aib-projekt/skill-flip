# Glossary Entry Generation Prompt Template

Use this prompt (with an LLM of your choice) to turn one raw skill bullet
from `content-pipeline/source/engineering-ladder.md` (the Skill Flip copy of
the canonical `Engineering Ladder.md` taxonomy) into one curated
`GlossaryEntry` record. Always pair this template with
`content-pipeline/rubric.md` — the rubric defines the quality bar the
generated draft must clear before it's added to `data/glossary.json`.

This is AI-*assisted*, not AI-*automated*: every generated entry is a draft
that a human manually reviews and edits before it's committed (see
`rubric.md` and Section 7.5/7.6 of the implementation plan).

## Inputs you provide

1. **Source bullet** — the exact raw line(s) from the taxonomy document, e.g.:
   > Regular: Generic types - wildcards
2. **Category** — one of the 12 `Category` enum values (see
   `src/types/glossary.ts`); for the source bullet above: `Java`.
3. **Level** — the level heading the bullet appears under in the source
   document (`Regular` or `Senior`; `Junior` where the source uses it). Note:
   a single source bullet occasionally implies more than one learnable
   concept — split it into multiple `GlossaryEntry` records rather than
   forcing an unnatural single term (see rubric "Splitting compound bullets").

## The Prompt

```
You are curating a bilingual (English/Polish) engineering flashcard glossary
entry from a single bullet point in an internal engineering skills ladder
document. Produce exactly one JSON object matching this TypeScript shape:

interface GlossaryEntry {
  id: string;              // stable lowercase-kebab-case slug, unique across the glossary
  term: string;             // the English CONCEPT NAME, not the full bullet text
  description: string;      // 1-3 sentence curated definition, in YOUR OWN WORDS
  translationPl: string;    // Polish translation of the TERM only
  descriptionPl: string;    // full definition translated into natural Polish
  category: string;         // one of the 12 valid Category values (given below)
  level: string;            // "Junior" | "Regular" | "Senior"
}

Source bullet: "<PASTE RAW BULLET TEXT HERE>"
Category: <CATEGORY>
Level: <LEVEL>

Rules:
- `term` is the concept name a flashcard learner would search for
  (e.g. "Idempotency", "JIT Compiler", "Optimistic Locking") — NEVER the
  full ability-statement sentence from the source bullet
  (e.g. NOT "Understanding of idempotency and safe methods").
- `description` must be a definition you write yourself, in your own words,
  from your own knowledge of the concept. It must NOT be a copy, near-copy,
  or light rewording of the source bullet — the source bullet tells you
  WHAT to define, not HOW to define it.
- `description` should be 1-3 sentences: enough for someone to actually
  learn the concept from the flashcard, not just recognize the name.
- `translationPl` translates only the term (e.g. "Idempotentność"), not a
  sentence.
- `descriptionPl` is a full, natural-sounding Polish translation of the
  entire `description` — not a literal word-for-word translation, and not
  merely the term repeated. A Polish-speaking learner should be able to
  learn the concept from `descriptionPl` alone.
- `id` is `<category-slug>-<term-slug>` in lowercase-kebab-case, e.g.
  "java-generics", "software-engineering-idempotency". It must be stable
  (do not regenerate/rename ids for existing entries when adding new ones).
- If the source bullet actually names multiple distinct concepts (e.g. a
  bullet listing 3 design patterns), output one JSON object PER concept
  instead of cramming them into one entry.
- Assign `level` based on where the bullet appears in the source document,
  but use judgment: if a concept is clearly foundational within its section
  relative to sibling bullets, Junior/Regular may be more accurate than a
  mechanical copy of the section heading — flag this in your output as a
  one-line note if you deviate, so the human reviewer can double check.

Output: a JSON array of one or more GlossaryEntry objects (usually one),
followed by a "Notes for reviewer:" section with any judgment calls made.
```

## After generation

1. Paste the model's output into a scratch file — do NOT paste directly into
   `data/glossary.json` unreviewed.
2. Run every entry through the checklist in `content-pipeline/rubric.md`.
3. Hand-edit anything that doesn't clear the bar (most entries need at least
   light editing — this is expected, not a failure of the prompt).
4. Append the reviewed entry/entries to `data/glossary.json`.
5. Run `npm run validate-glossary` and fix any reported schema errors.
