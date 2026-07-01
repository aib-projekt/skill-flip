# Design Decisions: Skill Flip — Engineering Lexicon

## TL;DR
Four decision areas converged, all on the brainstormer's recommended alternative: **Vite + vanilla TypeScript** (no framework) for the stack, a **bucketed weighted-random draw** for learn-mode resurfacing, a **single-card-with-controls model** (shared across Learn Mode/focus, hybridized with a flippable grid for Browse/Filter/Search), and a **documented, checked-in AI content-generation pipeline** (prompt template + rubric + validation script). Every choice sits at the "considered, not maximal" point on its spectrum — enough craft signal for the portfolio goal without over-engineering relative to a ~150-entry static app.

## Key Decisions
- **Tech stack — Vite + vanilla TypeScript, no framework**. Signals modern tooling literacy and gives compile-time safety on the glossary schema, without the maintenance/over-engineering risk of a UI framework for a 3-mode, ~150-entry app. (full alternatives: `analysis/alternatives.md` Decision Area 1)
- **Learn-mode algorithm — bucketed weighted-random draw** (`unseen`/`know`/`dont_know` buckets, `dont_know` weighted ~3-4x, graduates after N consecutive "know" marks, drops back on any miss). Matches the explicit "not binary, not full SRS" constraint and doubles as a simple progress readout. (Decision Area 2)
- **Interaction model — single-card-with-controls** (tap-to-flip, Prev/Next, swipe layered on top) as the shared component for Learn Mode and focused review, **hybridized with a flippable grid** specifically for Browse/Filter/Search results. One shared component minimizes duplication; the grid serves the "show full coverage fast" recruiter need without compromising Learn Mode's focus. (Decision Area 3)
- **Content pipeline — documented, checked-in artifact**: generation prompt template + curation rubric + a validation script (`npm run validate-glossary`). Makes the "curated, not transcribed" quality bar demonstrable, not just claimed, and becomes a second visible craft signal alongside the app itself. (Decision Area 4)

## Open Questions / Risks
- The bucketed algorithm's exact graduation threshold (N consecutive "know" marks) is deferred to specification — recommend pinning a concrete default (e.g. N=2) there.
- The single-card ↔ grid hybrid for Decision Area 3 is a reasoned synthesis, not a single clean alternative — specification needs to define exactly how state/transitions are shared between the two views.
- Validation-script scope must stay capped at "check the data," not grow into a full content-management CLI (noted as a risk in the alternatives doc).

---

## Selected Approach

All four decision areas were resolved in favor of the solution-brainstormer's recommended alternative, after full trade-off review with the user:

| Decision Area | Selected | Alternatives Considered |
|---|---|---|
| Tech stack | Vite + vanilla TypeScript (no framework) | Vanilla HTML/CSS/JS (zero build); Svelte/Preact + Vite; SSG + JS islands |
| Learn-mode algorithm | Bucketed weighted-random draw | Binary in/out (rejected pre-brainstorm); decaying/streak scoring; simplified SM-2-lite in-session reinsertion |
| Interaction model | Single-card-with-controls (Learn Mode/focus) + flippable grid (Browse/Filter/Search) | Swipeable Tinder-style stack; grid-of-flippable-cards as sole model |
| Content pipeline | Documented pipeline as repo artifact | Undocumented one-off; fully manual curation (no AI) |

Full alternatives, pros/cons, trade-off matrix, and evidence links: `analysis/alternatives.md`.

## Rationale

Each selection sits at the same relative point on its spectrum: meaningfully more considered than the "default minimal" option, but deliberately short of the "maximal/flashy" option that would risk over-engineering relative to this app's actual scope (~150 static entries, three interaction modes, no backend, no multi-user concerns). This consistency matters because the two personas' needs — the Creator's low-friction frequent mobile use, and the Recruiter's instant legibility and first-impression polish — turn out to pull in the same direction once scope is right-sized, rather than trading off against each other.

## Trade-Offs Accepted

- **Vite over vanilla JS**: accepts an npm/node build-tool dependency in exchange for type safety and a more demonstrable toolchain.
- **Bucketed weighting over decaying/streak scoring**: accepts coarser granularity in exchange for explainability and lower implementation risk — appropriate at ~150-card scale.
- **Single-card+grid hybrid over a pure swipe-stack**: accepts a slightly less flashy first-glance demo in exchange for one robust shared component plus full desktop/keyboard parity, and the ability to browse without recording a learn-mode judgment.
- **Documented content pipeline over a quiet one-off**: accepts extra upfront authoring time in exchange for a second visible craft artifact and future reusability (adding more categories later).

## Key Assumptions (carried from alternatives.md)

1. The creator is comfortable with a small Node/npm toolchain (reasonable for a backend engineer).
2. The ~150-card dataset size stays roughly fixed; if it grew 5-10x, a richer weighting model might earn back its complexity cost.
3. Real usage skews mobile, as described in the personas — if desktop review dominates instead, the swipe-gesture investment delivers less relative value (though button controls work fine either way).
4. The content pipeline will actually be reused/maintained, not run once and abandoned — if truly one-and-done, the documentation overhead is less justified, though the visible-craft argument still holds for the portfolio goal.
