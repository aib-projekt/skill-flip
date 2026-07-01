# Phase 1 Clarifications

## TL;DR
Git will be initialized as part of scaffolding. Repo targets `aib-projekt/skill-flip` (Vite `base: '/skill-flip/'`, Pages URL `https://aib-projekt.github.io/skill-flip/`). This implementation pass builds the full app + content pipeline tooling but authors only a starter subset (~15-20 terms, one category's worth) rather than the full ~150-term glossary — full authoring is a documented follow-up using the pipeline. License: MIT.

## Key Decisions
- Initialize git now, as part of this build (not left to the user) — needed for the GitHub Actions deploy workflow to have something to attach to.
- Target repo: `aib-projekt/skill-flip` — matches the GitHub org already referenced for the visual palette and the project's working directory name.
- Content scope for this pass: starter subset (~15-20 curated terms from one category), not the full ~150-term set — keeps this implementation pass focused on the app + pipeline, defers the larger content-authoring effort.
- License: MIT.

## Open Questions / Risks
- Full 12-category, ~150-term content authoring remains a follow-up task using the documented content pipeline (prompt template + rubric + validation script) — not part of this implementation pass's completion criteria.

---

## Q&A

**Q: Initialize git now?**
A: Yes — as part of scaffolding.

**Q: GitHub username/repo name for Vite base path and Pages URL?**
A: `aib-projekt/skill-flip` → `base: '/skill-flip/'`, live URL `https://aib-projekt.github.io/skill-flip/`.

**Q: Full ~150-term content set now, or a starter subset?**
A: Starter subset (~15-20 terms, one category's worth) as a working example. Full coverage deferred to a follow-up content-authoring pass using the pipeline built in this implementation.

**Q: License?**
A: MIT.
