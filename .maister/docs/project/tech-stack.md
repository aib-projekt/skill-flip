# Technology Stack

## Overview

This document describes the technology choices and rationale for Skill Flip, a client-only static single-page app.

## Languages

### TypeScript (5.6.2)
- **Usage**: ~100% of application source (`src/`, `content-pipeline/`, `scripts/`)
- **Rationale**: Strict static typing catches errors at compile time without a build-time framework tax; chosen over vanilla JS specifically to have a demonstrable, disciplined toolchain for the portfolio-facing goal
- **Key Features Used**: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, explicit type annotations on all function signatures, no implicit `any`, optional chaining (`?.`) and nullish coalescing (`??`)

## Frameworks

### Frontend
None. The app is hand-written vanilla TypeScript using direct DOM APIs (`createElement`, `appendChild`, `classList`, event listeners) via a component-factory pattern — factory functions (`createCard`, `createFilterBar`, `createBrowseGrid`, `createLearnMode`, `createAppShell`) return a small public API (`{ element, getState, setEntry, destroy }`) instead of using a framework's component model. This was a deliberate trade-off (accepted during design convergence) favoring a lean, dependency-free bundle and a clear demonstration of DOM fundamentals over framework productivity.

### Backend
None. This is a purely client-side static site — there is no server, API, or backend framework. Data is a static `data/glossary.json` file fetched at load; the only persistence is browser `localStorage` for Learn Mode progress.

### Testing
- **Vitest 2.1.4** — unit/component test runner (Jest-compatible API), chosen for native Vite integration
- **jsdom 25.0.1** — DOM simulation environment for component tests (component tests query rendered DOM and dispatch events)

## Database

None. No database is used. Content lives in `data/glossary.json` (159 entries, validated by a standalone schema checker); user progress lives in browser `localStorage` only (no cross-device sync by design).

## Build Tools & Package Management

- **npm** — package management (see `package-lock.json`)
- **Vite 5.4.10** — dev server and production bundler, with a custom plugin for serving `/data/` during development
- **TypeScript compiler (`tsc -b`)** — type-checking step ahead of the Vite build (`npm run build` = `tsc -b && vite build`)

## Infrastructure

### Containerization
None detected — not applicable to a static site with no backend.

### CI/CD
**GitHub Actions** (`.github/workflows/deploy.yml`) — pipeline runs glossary content validation, type-checking, the test suite, and a production build, then deploys to GitHub Pages automatically on push to `main`.

### Hosting
**GitHub Pages** — static hosting, deployed at the project's `gh-pages`-style base path (`vite.config.ts` sets `base: "/skill-flip/"`).

## Development Tools

### Linting & Formatting
None configured (no ESLint/Prettier). Code style consistency is currently maintained manually — the codebase shows disciplined, uniform style (2-space indentation, single quotes, consistent naming) without tooling enforcement. Flagged in project analysis as a candidate for future tooling, not an urgent gap given project size.

### Type Checking
TypeScript strict mode (`tsconfig.json`), enforced both via `tsc -b` in the build script and implicitly via IDE feedback during development.

## Key Dependencies

**Runtime dependencies: zero.** The shipped app bundles no external libraries — this is a deliberate simplicity choice for a small, static, dependency-averse project.

**Dev dependencies** (from `package.json`):
- `@types/node` ^22.9.0
- `jsdom` ^25.0.1
- `typescript` ^5.6.2
- `vite` ^5.4.10
- `vitest` ^2.1.4

## Version Management

Standard `package.json`/`package-lock.json` semver ranges (caret `^`); no automated dependency-update tooling (Dependabot/Renovate) configured yet.

## Migration Path

Not applicable — this is a young, actively-maintained project on current tooling versions, not a legacy system requiring migration.

---
*Last Updated*: 2026-07-04
*Auto-detected*: All of the above was detected directly from `package.json`, `tsconfig.json`, `vite.config.ts`, `.github/workflows/deploy.yml`, and source inspection during project analysis — no user-provided corrections were needed.
