# Source Taxonomy Reference

The content pipeline curates `GlossaryEntry` records from the raw skill
bullets in the **Engineering Ladder** taxonomy document maintained here:

```
.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/context/Engineering Ladder.md
```

This file is a pointer rather than a duplicated copy, so the pipeline
always curates against the single canonical source instead of a snapshot
that can silently drift out of sync as the ladder document evolves.

## How to use it with `prompt-template.md`

1. Open the canonical document at the path above.
2. Find the section matching the `Category` you're curating for (the
   document's section headings map 1:1 onto the 12 `Category` enum values
   in `src/types/glossary.ts`, e.g. `### Java` → `category: "Java"`,
   `### Spring/JEE` → `category: "Spring/JEE"`).
3. Copy the raw bullet(s) for the level you're curating (`Junior` /
   `Regular` / `Senior`) into `content-pipeline/prompt-template.md`'s
   `<PASTE RAW BULLET TEXT HERE>` placeholder.
4. Curate, review against `content-pipeline/rubric.md`, and append the
   result to `data/glossary.json`.

## Starter dataset provenance (first pass)

The first ~15-20 entries shipped in `data/glossary.json` were all curated
from the `### Java` section (`Regular` and `Senior` subsections) of the
canonical document above. The remaining 13 categories were an explicitly
deferred follow-up at that point.

## Full-coverage pass (second pass)

The remaining 13 categories (Soft Skills, Management, Mentoring, Problem
Solving, API Development, Cloud Engineering, Data Storage, DevOps, Software
Engineering, Spring/JEE, Testing) were subsequently curated from every
remaining bullet in the canonical document, bringing `data/glossary.json`
to full coverage of all 14 categories. Judgment calls made during this pass,
per `prompt-template.md`'s guidance to flag deviations:

- **Soft Skills** has no `Regular`/`Senior` split in the source document (a
  flat bullet list). All entries were curated as `Regular`, since these are
  baseline expectations rather than senior-specific skills.
- **Consumer-Driven Contract Testing (CDC/Pact)** and **End-to-End (E2E)
  Testing** appear under the source's `### Software Engineering` section,
  but were curated into the `Testing` category instead, since that's where
  a learner would expect to find them and the `Testing` section separately
  references the same concepts.
- A handful of source bullets that named the same concept already covered
  elsewhere (e.g. `SOLID - deep understanding` under Senior Software
  Engineering, duplicating the Regular `SOLID Principles` entry; `Idempotency`
  appearing in both API Development and implicitly in Testing) were not
  re-curated as separate entries — `validate-glossary.ts` disallows duplicate
  `(term, category)` pairs, and a second, near-identical flashcard in the same
  category wouldn't teach anything new.
