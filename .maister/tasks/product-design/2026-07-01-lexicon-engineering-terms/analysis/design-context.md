# Design Context: Skill Flip — Engineering Lexicon

## TL;DR
Personal flashcard-style web app for reviewing Java/Backend engineering terms (Regular/Senior), sourced from a 12-category Engineering Ladder taxonomy. Client-only (no backend), data/UI separated via a JSON glossary file. Dual purpose: personal spaced-repetition-style study tool + a public, portfolio-quality GitHub repo. Core mechanics already specified by the user: flip cards, category/level filters, full-text search, a "learn mode" with know/don't-know tracking in localStorage, EN term + PL translation, GitHub Pages deploy, and a contributor-friendly README. Stack (vanilla JS vs Vite) is still open.

## Key Decisions
- No project docs / codebase exist yet — this is a from-scratch (greenfield) design. (rationale: empty working directory, no `.maister/docs/`)
- Treated as client-only, no backend — data lives in a static `data/glossary.json` plus browser `localStorage` for progress. (rationale: user explicitly listed GitHub Pages deploy and "data separated from UI" as a static file, not an API)

## Open Questions / Risks
- Tech stack undecided: user offered vanilla HTML/CSS/JS vs Vite vs "Claude's suggestion" — needs a convergence decision (Phase 5).
- Scope of "full-text search" unclear: search only `term`, or also `description`/translations?
- Content volume unknown: the Engineering Ladder taxonomy has ~12 categories × 2-3 levels each with many bullet items — need to decide how many of these become actual glossary cards (all of them verbatim, or a curated subset with authored definitions?).
- "Portfolio piece" audience isn't just the user — recruiters/visitors browsing GitHub will read the README and possibly try the live demo, which affects tone, onboarding, and the "add new cards" contribution docs.

---

## Source 1: User-supplied project brief (`context/Skill Flip.md`)

**Context** (translated from Polish): Building a personal lexicon of engineering terms (Java/Backend, Senior level) as an interactive HTML app, based on the Engineering Ladder document (categories: Soft Skills, Management, Mentoring, Problem Solving, API Development, Cloud Engineering, Data Storage, DevOps, Java, Software Engineering, Spring/JEE, Testing — each split Regular/Senior). Dual goal: 1) personal study/review tool, 2) public GitHub repo as another portfolio project.

**Functional requirements** (as specified by the user):
- Data separated from UI: `data/glossary.json` with fields `term`, `description`, `category`, `level`
- Flip-style cards (term on front, description on back)
- English language with Polish translation
- Filtering by category and level (Regular/Senior)
- Full-text search
- Learn mode: random order + "know / don't know" marking + progress counter persisted in `localStorage`
- Structure ready for GitHub Pages
- README with project description and instructions for adding new cards

**Stack options** (user's own framing, decision deferred):
- **A** — vanilla HTML/CSS/JS: zero dependencies, simplest deploy. User's default lean, "unless you want to show more frontend chops."
- **B** — Vite: adds a build step, more conventional modern frontend setup.
- **C** — "Claude Code's suggestion" — open invitation for a recommendation.

**Content source**: `Engineering_Ladder.md` (see Source 2 below).

## Source 2: Engineering Ladder taxonomy (`context/Engineering Ladder.md`)

A structured skills-ladder document ("JIT Team Human factor of IT") defining IT experience tiers (Regular: 2-5 yrs, Senior: >5 yrs) and skills across 12 categories, most split Regular/Senior (API Development also includes a Junior tier):

| Category | Regular/Junior topics (examples) | Senior topics (examples) |
|---|---|---|
| Soft Skills | (not tiered) Communicativeness, professionalism, willingness to grow, building relationships | — |
| Management | Task delegation, project management | Strategic planning, process optimization |
| Mentoring | Active mentoring of juniors | Leading mentoring programs |
| Problem Solving | Complex problem solving, technical writing | Advanced data analysis, creative approach |
| API Development | HTTP/HTTPS, CRUD verbs, status codes, JSON, Postman (Junior); idempotency, OAuth2/JWT, versioning, OpenAPI, GraphQL basics (Regular) | Scalable API architecture, monitoring/logging, advanced GraphQL, API gateways, OpenID Connect |
| Cloud Engineering | Purpose of cloud, scaling types, PaaS/SaaS/IaaS | Hyperscalers, managed services, IaC (Terraform/Bicep/CloudFormation) |
| Data Storage | JDBC/ORM, NoSQL types, transactions, locking, JPA, N+1 problem | Dirty checking, cache types, entity graphs, isolation levels, distributed DBs, partitioning |
| DevOps | Docker Compose, basic CI/CD | Dockerfile internals, image build process |
| Java | Encoding, memory model, generics, JVM basics, GC basics, Streams, collections, concurrency basics | JIT compiler, GC implementations, parallel streams, advanced concurrency (virtual threads etc.) |
| Software Engineering | Design patterns (Adapter/Builder/Decorator), SOLID, data structures/algorithms, CQRS/DDD awareness | Advanced patterns (Observer/Proxy/Visitor/State Machine/Saga), graph algorithms, CDC/E2E tests |
| Spring/JEE | Caching, @Bean vs @Component, DI, exception handling, Spring Data, Spring Security | WebFlux, SpEL, AOP, custom annotations, autoconfiguration, starters |
| Testing | Unit/integration testing, mocking, TDD/BDD awareness | Advanced integration testing, contract testing |

This is the **raw content source** — each bullet is a candidate glossary entry (`term` + `description`), tagged with `category` and `level`. It is NOT yet in the `data/glossary.json` shape; converting it is a scoping question (curate vs. transcribe everything) to resolve during problem exploration / specification.

## Implications for Design

1. **Content pipeline is a first-class concern**: unlike a typical "empty CRUD app," this design starts with a large, real content corpus that must be transformed into structured glossary entries. The spec needs a clear answer for "who writes the `description` field and in what voice" (ladder bullets are skill descriptors, not always polished glossary definitions).
2. **i18n is lightweight but real**: EN term + PL translation is a data-model requirement (an extra field), not a full i18n framework — keep the glossary schema and UI copy simple.
3. **No backend simplifies deployment** but means all "learning mode" state is per-browser (localStorage) — no cross-device sync, which is fine for a personal tool but worth stating explicitly as a constraint/non-goal.
4. **Portfolio-quality README matters** as much as the app itself, since one of the two goals is external-facing (GitHub visitors), not just personal use.
