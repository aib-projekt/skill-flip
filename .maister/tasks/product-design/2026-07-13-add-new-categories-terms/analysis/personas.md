# Personas

## TL;DR
Two personas: the app owner as Interview-Prep Curator (primary — drives category naming and curation-plan requirements) and a Portfolio Visitor/recruiter (secondary — drives the requirement that category names read as credible/recognizable to an outside senior engineer, and that the FilterBar stays scannable as it grows).

## Key Decisions
- Learn Mode's existing filter-scoping (category/level filter persisted from Browse, shipped 2026-07-05) already satisfies the Curator's "drill just the new categories" need — no new Learn Mode feature required, just correct category wiring.
- Portfolio Visitor persona included despite this being a content/taxonomy task, because category *naming* is a user-facing decision that affects how an outside reviewer reads the app's signaled expertise.

## Open Questions / Risks
- None new beyond what's already tracked in `problem-statement.md`.

---

## Persona 1: The Interview-Prep Curator (primary)

**Role**: The app's owner — author, curator, and primary learner, currently preparing for senior/staff-level engineering interviews.

**Goals**:
- Consolidate scattered personal notes (mixed Polish/English, architecture/microservices/system-design) into the same spaced-review system already used for Java/Backend terms.
- Be able to filter down to just the new categories in the weeks before an interview.
- Trust that new content meets the same curation bar as existing entries (bilingual, rewritten not transcribed, per `content-pipeline/rubric.md`).

**Pain points**:
- Source notes are raw, overlapping, and partly in Polish — turning them into proper flashcards is real curation work, not a copy-paste job.
- The filter bar is already near visual capacity (7 of 12 categories in overflow at 5-visible); more categories risk clutter.
- Temptation to curate everything at once instead of shipping the taxonomy design incrementally.

**Key journey**: Opens Browse → selects a new category chip (e.g. "System Design") → switches to Learn Mode, which already auto-scopes to that active filter and persists it across sessions (shipped `7dbb9af`) → drills weighted cards, marks know/don't-know, progress saves to `localStorage`. Separately, periodically returns to `content-pipeline/` to curate more raw notes into entries using the existing `prompt-template.md`/`rubric.md` process.

**Discovery path insight**: This persona already knows the app intimately (they built it) — no onboarding/discoverability concerns apply. The relevant discovery path is purely: does the new category appear correctly in the filter bar, and does it correctly scope Learn Mode.

## Persona 2: The Portfolio Visitor (secondary)

**Role**: A recruiter or senior engineer evaluating the author's craft via the live GitHub Pages demo, without reading source code first.

**Goals**:
- Quickly gauge the breadth and seniority of the author's backend engineering knowledge.
- See a well-crafted, uncluttered app as a proxy for the author's engineering discipline.

**Pain points**:
- Won't invest time in a confusing or overloaded filter UI — first impression matters and is brief (seconds, not minutes).
- Doesn't read Polish — relies entirely on the English side of bilingual content.

**Key journey**: Lands on the deployed demo → skims categories in Browse (may never open Learn Mode) → recognizable category names like "System Design" or "Microservices Patterns" signal senior-level breadth at a glance, even without reading individual entries.

**Discovery path insight**: This persona's entire interaction may be the Browse grid + filter bar alone. Category *naming* quality (industry-recognizable terms, not personal shorthand) and filter-bar scannability at a higher category count both directly serve this persona, even though neither is a new feature.
