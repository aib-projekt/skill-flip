# Documentation Index

**IMPORTANT**: Read this file at the beginning of any development task to understand available documentation and standards.

## Quick Reference

### Project Documentation
Project-level documentation covering vision, goals, architecture, and technology choices.

### Technical Standards
Coding standards, conventions, and best practices organized by domain. Initialized categories: Global, Frontend, Testing. Backend standards were intentionally skipped (this project is a client-only static site with no backend/server code).

---

## Project Documentation

Located in `.maister/docs/project/`

Skill Flip is a Vite + vanilla TypeScript SPA — a bilingual (English/Polish) Java/Backend engineering flashcard lexicon, serving as both a personal study tool and a recruiter-facing portfolio piece.

### Vision (`project/vision.md`)
Purpose and dual priorities (personal spaced-study tool + portfolio artifact), current state (shipped, ~3 days old, all 14 phases complete), target users, and 6-12 month direction (content maintenance and small UX fixes over major feature work).

### Roadmap (`project/roadmap.md`)
Current feature set (Learn Mode weighted drill, Browse search/filter, bilingual cards, content pipeline, CI/CD to GitHub Pages), recent updates from git history, and planned enhancements grouped by priority (glossary maintenance, UX fixes, documentation gap, Polish UI translation) plus technical debt (no linter/formatter, no E2E coverage).

### Tech Stack (`project/tech-stack.md`)
TypeScript 5.6.2 (strict mode) with no frontend framework (hand-written component-factory pattern), no backend/database (static `data/glossary.json` + `localStorage`), Vite 5.4.10 build tooling, Vitest/jsdom testing, zero runtime dependencies, and GitHub Actions → GitHub Pages CI/CD.

### Architecture (`project/architecture.md`)
Component-factory pattern with UI/logic separation (no framework): DOM-owning components in `src/components/` (`AppShell`, `Card`, `LearnMode`, `BrowseGrid`, `FilterBar`) vs. pure testable logic in `src/lib/` (filters, weighted learn algorithm, storage); describes data flow from bootstrap through Learn/Browse modes, plus the decoupled `content-pipeline/` curation tooling kept out of the shipped bundle.

---

## Technical Standards

### Global Standards

Located in `.maister/docs/standards/global/`

#### Coding Style (`standards/global/coding-style.md`)
Naming consistency, automatic formatting, descriptive names, focused functions, uniform indentation, no dead code, avoiding unneeded backward compatibility, and DRY (Don't Repeat Yourself).

#### Commenting (`standards/global/commenting.md`)
Letting code speak for itself, commenting sparingly, and avoiding changelog-style "change comments" in code.

#### Development Conventions (`standards/global/conventions.md`)
Predictable project structure, up-to-date documentation, clean version control practices, environment variable handling, minimal dependencies, consistent code reviews, testing standards, feature flags, changelog updates, and building only what's needed.

#### Error Handling (`standards/global/error-handling.md`)
Clear user-facing messages, failing fast, typed exceptions, centralized error handling, graceful degradation, retry with backoff, and resource cleanup.

#### Minimal Implementation (`standards/global/minimal-implementation.md`)
Building only what you need, maintaining clear purpose, deleting exploration artifacts, avoiding future stubs and speculative abstractions, reviewing before commit, and treating unused code as debt.

#### Validation (`standards/global/validation.md`)
Server-side validation as the authority, client-side validation for feedback, validating early, specific error messages, allowlists over blocklists, type/format checks, input sanitization, business rule validation, and consistent enforcement.

---

### Frontend Standards

Located in `.maister/docs/standards/frontend/`

#### Accessibility (`standards/frontend/accessibility.md`)
Semantic HTML, keyboard navigation, color contrast, alt text and labels, screen reader testing, ARIA usage when needed, heading structure, and focus management.

#### Components (`standards/frontend/components.md`)
Single responsibility, reusability, composability, clear interfaces, encapsulation, consistent naming, local state management, minimal props, and component documentation.

#### CSS (`standards/frontend/css.md`)
Consistent methodology, working with the framework rather than against it, design tokens, minimizing custom CSS, and production optimization.

#### Responsive Design (`standards/frontend/responsive.md`)
Mobile-first design, standard breakpoints, fluid layouts, relative units, cross-device testing, touch-friendly interactions, mobile performance, readable typography, and content priority.

---

### Backend Standards

*Not initialized for this project.* Skill Flip is a client-only static site (Vite + vanilla TypeScript SPA) with no backend/server code, so backend standards (API design, models, queries, migrations) were intentionally skipped during initialization.

If backend code is added later, you can:
- Add backend standards manually using the docs-manager skill
- Run `/maister:standards-discover --scope=backend` to auto-discover

---

### Testing Standards

Located in `.maister/docs/standards/testing/`

#### Test Writing (`standards/testing/test-writing.md`)
Testing behavior over implementation, clear test names, mocking external dependencies, fast execution, risk-based testing, balancing coverage and velocity, critical path focus, and appropriate test depth.

---

## How to Use This Documentation

1. **Start Here**: Always read this INDEX.md first to understand what documentation exists
2. **Project Context**: Read relevant project documentation before starting work
3. **Standards**: This index only points to the standards — open and follow the specific standard files relevant to your task; don't rely on the index alone
4. **Keep Updated**: Update documentation when making significant changes
5. **Customize**: Adapt all documentation to your project's specific needs

## Updating Documentation

- Project documentation should be updated when goals, tech stack, or architecture changes
- Technical standards should be updated when team conventions evolve
- Always update INDEX.md when adding, removing, or significantly changing documentation
