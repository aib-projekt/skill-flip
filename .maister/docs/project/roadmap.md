# Development Roadmap

## Current State

- **Version**: 0.1.0
- **Key Features**:
  - Learn Mode — single-card weighted-random drill (bucketed weighting: `dont_know` > `unseen` > `know`, graduation after 2 consecutive "know" marks), swipe/button marking, `localStorage`-persisted progress
  - Browse — searchable (term + EN/PL description) and filterable (category multi-select + level segmented control) grid of all 292 entries
  - Bilingual cards — English term/description always shown; Polish term + full description translation behind an explicit `(i)` toggle
  - Documented content pipeline (`content-pipeline/`) — prompt template + curation rubric + schema validator (`npm run validate-glossary`), decoupled from the app bundle
  - Full 14-category taxonomy coverage (Java, Spring/JEE, Data Storage, DevOps, Cloud Engineering, Testing, Soft Skills, Management, Mentoring, Problem Solving, API Development, Software Engineering, Software Architecture, Microservices & Distributed Systems)
  - GitHub Actions CI → GitHub Pages auto-deploy on push to `main`
- **Recent Updates** (from git history):
  - Full-coverage content pass: expanded glossary from 20 (Java-only) to 292 entries across all 14 categories
  - Fixed an inert "+N more" category filter chip in Browse (7 of 14 categories were unreachable via chip filtering until this fix)
  - User-facing documentation with screenshots added
  - Development workflow finalized through "Phase 14"

## Planned Enhancements (Next 3-6 Months)

### High Priority
- [ ] **Ongoing glossary maintenance** — add/refine entries as the source Engineering Ladder taxonomy evolves, keeping the curated definitions (not verbatim transcriptions) up to the rubric's quality bar
- [ ] **Fix small UX issues as they surface** — this project is actively used, so bugs like the recent overflow-chip fix should be expected and triaged quickly via `/maister:quick-bugfix`

### Medium Priority
- [ ] **Close the documentation gap** — add an `ARCHITECTURE.md`/`DEVELOPMENT.md` (flagged by project analysis as the highest-value missing doc) to strengthen the portfolio-facing side of the project
- [ ] **UI translation to Polish** — glossary content is already bilingual; the UI chrome (buttons, labels, hints) is still English-only

### Technical Debt
- [ ] **No linter/formatter configured** — currently relies on manual consistency (which has held up well so far); adding ESLint/Prettier would reduce drift risk for future contributions
- [ ] **No E2E test coverage** — 44 unit/component tests exist, but no full-journey browser tests (Learn Mode drill, Browse filter/search, mode switching)

## Future Considerations

- **Feature Ideas**: mastery celebration banner (100%-mastered edge case, previously deferred as nice-to-have, not required), Dependabot/Renovate for dependency freshness, CI status badges in README
- **Scalability**: not a current concern — this is a small, static, client-only app with no backend to scale; glossary growth (more entries/categories) is the only axis likely to grow, and the data-driven filter UI already handles that without code changes
