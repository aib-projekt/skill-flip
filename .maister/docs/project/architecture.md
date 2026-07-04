# System Architecture

## Overview

Skill Flip is a static, client-only single-page application with no router: a single root component (`AppShell`) toggles in-place between two view modes (Learn, Browse). The architecture cleanly separates stateful DOM-owning UI components from pure, independently-testable logic functions, and keeps a decoupled offline content-curation tool entirely out of the shipped bundle.

## Architecture Pattern

**Pattern**: Component-factory pattern with UI/logic separation (no framework)

Instead of a component framework's class/hooks model, each UI piece is a factory function (`createCard`, `createFilterBar`, `createBrowseGrid`, `createLearnMode`, `createAppShell`) that builds its own DOM subtree via direct `document.createElement` calls, owns its state in a closure, wires its own event listeners, and returns a small public API: `{ element, getState, setEntry?, destroy }`. Parent components mount children by appending `child.element` and reacting to callbacks (e.g. `FilterBar`'s `onChange`), rather than through props/state propagation machinery.

Business/data logic (filtering, the Learn Mode weighted-draw algorithm, `localStorage` persistence) is deliberately kept in plain functions under `src/lib/`, with no DOM access, so it can be unit-tested in isolation from rendering.

## System Structure

### `src/types/`
- **Location**: `src/types/glossary.ts`
- **Purpose**: Core data model — `GlossaryEntry` (id, term, description, translationPl, descriptionPl, category, level), the 12-value `Category` union, and the 3-value `Level` union
- **Key Files**: `glossary.ts`, `glossary.test.ts`

### `src/components/`
- **Location**: `src/components/`
- **Purpose**: Stateful, DOM-owning UI pieces
- **Key Files**:
  - `AppShell.ts` — root shell; view switcher (Learn/Browse), shared bottom tab bar
  - `Card.ts` — reusable flip-card, two variants (`full` for Learn Mode, `tile` for Browse grid); owns flip/translation-toggle state, swipe/click navigation
  - `LearnMode.ts` — wraps `Card`; draws next card via the weighted algorithm, persists mark decisions
  - `BrowseGrid.ts` — wraps `FilterBar` + a grid of `Card` tiles; recomputes filtered results and result count on every filter change
  - `FilterBar.ts` — search input (200ms debounced) + category chips (5 visible + expandable overflow) + level segmented control; fires `onChange` with the new `BrowseFilterState`
  - `progressStats.ts` — pure helpers computing mastered/shaky/new counts, shared by both views' topbars

### `src/lib/`
- **Location**: `src/lib/`
- **Purpose**: Pure, DOM-free logic — the testable core of the app's behavior
- **Key Files**:
  - `filters.ts` — `applyFilters(glossary, state)`: category + level + multi-field text search, AND-combined
  - `learnAlgorithm.ts` — bucketed weighted-random draw (`dont_know`=4, `unseen`=2, `know`=1) with graduation after 2 consecutive "know" marks
  - `storage.ts` — reads/writes the `skillflip:learn-progress` `localStorage` key, computes bucket counts
  - `config.ts` — tunable constants (`BUCKET_WEIGHTS`, `GRADUATION_THRESHOLD`)

### `content-pipeline/` (decoupled, not part of the shipped app)
- **Location**: `content-pipeline/`
- **Purpose**: Offline, AI-assisted content curation tooling for authoring `data/glossary.json` entries — deliberately has zero shared dependency with `src/` (its validator hand-mirrors the `GlossaryEntry` shape rather than importing it) so it never gets bundled into the Vite build
- **Key Files**: `prompt-template.md` (LLM prompt for drafting one entry from a raw source bullet), `rubric.md` (human review checklist), `validate-glossary.ts` (+ test) — schema/uniqueness validator run via `npm run validate-glossary` and in CI

### `data/`
- **Location**: `data/glossary.json`
- **Purpose**: Single source of truth for all 159 glossary entries across 12 categories; fetched once at app bootstrap

## Data Flow

1. **Bootstrap** (`src/main.ts`): `fetch('/data/glossary.json')` → validate it's a non-empty array → mount `AppShell` with the loaded glossary, or render a minimal error state on fetch/parse failure
2. **Learn Mode**: glossary + current `localStorage` progress → `learnAlgorithm.nextCard()` selects a weighted-random entry → `Card.setEntry()` renders it → user swipes/clicks know/don't-know → `storage.writeProgress()` persists the updated bucket, immediately (not batched)
3. **Browse**: glossary + `FilterBar` state → `applyFilters()` (pure function) → `BrowseGrid` re-renders the tile grid and result count; both views' topbars independently call the shared `progressStats` helpers against current `localStorage` state

## External Integrations

None. No external APIs, third-party services, or databases are integrated — the only "integration" is the browser's own `fetch` (for the static JSON file) and `localStorage` APIs.

## Database Schema

Not applicable (no database). The closest equivalent is the `GlossaryEntry` TypeScript interface in `src/types/glossary.ts`, enforced at the content layer by `content-pipeline/validate-glossary.ts` (schema shape, category/level enum membership, unique `id`, unique `(term, category)` pairs).

## Configuration

Build-time configuration lives in `vite.config.ts` (base path `/skill-flip/` for GitHub Pages, a custom dev-only plugin serving `/data/`) and `tsconfig.json` (strict compiler options). Runtime tuning constants (algorithm weights, thresholds) live in `src/lib/config.ts` rather than environment variables, since there is no server/environment distinction to configure around.

## Deployment Architecture

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to `main`: validate glossary content → type-check → run tests → build → deploy the static `dist/` output to GitHub Pages. There is no server-side deployment target — the entire runtime artifact is static files served by GitHub Pages.

---
*Based on codebase analysis performed 2026-07-04*
