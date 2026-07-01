# Personas: Skill Flip — Engineering Lexicon

## TL;DR
Two personas, equally prioritized: **the Creator** (primary — a Senior-track backend engineer doing short, frequent mobile study sessions) and **the Recruiter/Visitor** (secondary — arrives via a shared link, expects to interact with the live demo within seconds, no reading required first). Both journeys must work with zero setup friction.

## Key Decisions
- Learn Mode must resume instantly with no configuration step, since the Creator's real usage pattern is short, frequent bursts (5-10 min), not long deliberate sessions.
- The live GitHub Pages demo is the primary landing experience for the Recruiter persona — README-first is secondary, not the default entry point. (rationale: recruiters try the interactive demo immediately rather than reading documentation first)

## Open Questions / Risks
- None outstanding — both personas approved without revision.

---

## Persona 1: The Creator (Primary — Learner)

- **Role**: Backend/Java engineer studying toward Senior-level roles
- **Goals**: Reinforce and self-test engineering vocabulary in short, frequent sessions; track which terms are still shaky
- **Pain points**: No single organized place to review this specific vocabulary; generic flashcard apps don't have this curated content; risk of "review fatigue" if sessions require setup or feel like a chore
- **Usage pattern**: Short bursts, frequent — 5-10 minute sessions, several times a week, mostly on mobile during commute/downtime
- **Key journey**: Opens the app during a commute/break → taps into Learn Mode → flips through a handful of cards (weighted toward "don't know" ones) → marks know/don't-know → closes after 5-10 min, progress saved automatically for next time. Occasionally browses/filters by category outside learn mode to look something up directly.

## Persona 2: The Recruiter/Visitor (Secondary — Evaluator)

- **Role**: Technical recruiter, hiring manager, or peer engineer browsing a portfolio
- **Goals**: Quickly gauge technical competence and craft quality; form a positive impression fast
- **Pain points**: Most portfolio projects are generic to-do apps or unfinished demos; low tolerance for friction (broken links, unclear purpose, slow load)
- **Discovery path**: Arrives via a CV/LinkedIn/GitHub link, landing directly on the live GitHub Pages demo (not the README first)
- **Key journey**: Arrives via a shared link → immediately flips a card or two, tries a filter/search without reading instructions → forms an impression within seconds → may click through to the repo/README afterward for more depth (code quality, commit history) rather than before.
