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

## Starter dataset provenance (this pass)

The ~15-20 entries shipped in `data/glossary.json` for this pass were all
curated from the `### Java` section (`Regular` and `Senior` subsections) of
the canonical document above. The remaining 11 categories and the
`Junior` level are defined in the schema (`src/types/glossary.ts`) and
accepted by `validate-glossary.ts`, but intentionally have zero entries in
this pass — populating them is the explicitly deferred follow-up work this
pipeline exists to support (see `implementation/spec.md`, "Content Scope
for This Pass").
