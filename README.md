# Skill Flip — Engineering Lexicon

A flip-card flashcard app for reviewing curated software-engineering terms.
Flip a card, mark what you know, and Skill Flip quietly concentrates your
review time on the terms you keep missing — no accounts, no backend, no
setup step.

**Live demo:** https://aib-projekt.github.io/skill-flip/

Built as a portfolio piece: a small, complete, client-only web app —
flip/swipe interactions, a weighted-review algorithm, a filterable/searchable
browse grid, bilingual (EN/PL) content, and a documented content-authoring
pipeline for growing the glossary over time.

## Tech stack

- **[Vite](https://vitejs.dev/)** — dev server and static build, zero backend
- **TypeScript**, vanilla (no UI framework) — DOM built and updated directly
- **[Vitest](https://vitest.dev/)** — unit tests for pure logic (filters,
  learn algorithm, storage, components)
- **GitHub Actions + GitHub Pages** — CI validates content and builds on
  every push to `main`; the built `dist/` is deployed automatically
- Plain CSS custom properties for theming — no CSS framework

No environment variables or secrets are required anywhere in this project;
it is fully static.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (typically `http://localhost:5173`).

Other useful scripts:

```bash
npm run build             # type-check + production build into dist/
npm run preview           # serve the production build locally
npm test                  # run all tests (Vitest unit tests + build/config checks)
npm run validate-glossary # validate data/glossary.json against the schema
```

## Project structure

```
data/glossary.json        # the glossary content itself (source of truth)
src/
  types/glossary.ts       # GlossaryEntry / Category / Level types
  components/             # Card, BrowseGrid, FilterBar, LearnMode, AppShell
  lib/                    # filters, learn algorithm, localStorage helpers, config
  styles/theme.css        # CSS custom-property palette, breakpoints, motion rules
  main.ts                 # entry point: fetch glossary, mount AppShell
content-pipeline/         # standalone tooling for authoring new glossary entries
  prompt-template.md      # LLM prompt template for drafting new entries
  rubric.md               # quality checklist a draft must clear before merging
  validate-glossary.ts    # schema validator (npm run validate-glossary)
scripts/verify-build.test.ts  # build-output and deploy-config smoke checks
.github/workflows/deploy.yml  # CI: validate → build → deploy to GitHub Pages
```

The app has two views, swapped in place by `AppShell` (no router, no URL
state): **Learn Mode** (one card at a time, weighted toward terms you've
marked "don't know") and **Browse** (search + filter the full set in a
responsive grid).

## Adding new glossary entries

All content lives in `data/glossary.json`, an array of objects shaped like:

```ts
interface GlossaryEntry {
  id: string;            // stable lowercase-kebab-case slug, e.g. "java-generics"
  term: string;           // English term
  description: string;    // 1-3 sentence English definition
  translationPl: string;  // Polish translation of the term
  descriptionPl: string;  // Polish translation of the full definition
  category: string;       // one of 12 fixed categories — see src/types/glossary.ts
  level: string;          // "Junior" | "Regular" | "Senior"
}
```

### Option A — manual edit

1. Open `data/glossary.json` and append a new entry object following the
   shape above. Use a unique `id` (no duplicates) and make sure `category`
   and `level` are one of the values in `src/types/glossary.ts`.
2. Run `npm run validate-glossary` to catch schema errors (missing fields,
   invalid enum values, duplicate `id`s, duplicate `(term, category)` pairs)
   before committing.
3. Run `npm run dev` and confirm the new entry appears in Browse and Learn
   Mode as expected.

### Option B — content pipeline (AI-assisted)

For adding many entries at once (e.g. growing beyond the current Java-only
starter set toward the full ~150-term taxonomy):

1. Pick a raw bullet from `content-pipeline/source/` (the skills-taxonomy
   source document).
2. Feed it, along with its category and level, into the prompt in
   `content-pipeline/prompt-template.md`, using any LLM.
3. Run the generated draft(s) through the checklist in
   `content-pipeline/rubric.md` — every draft needs a human review pass
   before it's added; the pipeline is AI-*assisted*, not AI-*automated*.
4. Append the reviewed entry/entries to `data/glossary.json`.
5. Run `npm run validate-glossary` and fix any reported errors.

Either path ends the same way: `data/glossary.json` passes
`npm run validate-glossary` with zero errors, and the GitHub Actions
workflow re-validates it on every push to `main` before deploying.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs
`npm ci` → `npm run validate-glossary` → `npm run build`, then publishes
`dist/` to GitHub Pages. No manual deploy step, no secrets to configure.

## License

MIT — see [LICENSE](./LICENSE).
