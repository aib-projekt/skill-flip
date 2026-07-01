# Production Readiness Report

**Date**: 2026-07-01
**Path**: `/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/` (task: `.maister/tasks/development/2026-07-01-skill-flip-engineering-lexicon/`)
**Target**: production (static-site deployment context, see scope note below)
**Status**: Ready

## Scope Note

This is a fully static, client-only web app (Vite + vanilla TypeScript): no backend, no user accounts, no server component, no environment variables/secrets by design, deployed to GitHub Pages via GitHub Actions (OIDC-based `actions/deploy-pages`). The standard backend-oriented production checklist (connection pooling, rate limiting, server monitoring/logging, DB migrations, CORS, graceful shutdown, circuit breakers, etc.) is **not applicable** and has been scored N/A rather than penalized. This assessment instead applies the checks that actually matter for a static site: build reliability, deployment pipeline correctness, client-side error handling, and static-site-appropriate security hygiene.

## Executive Summary
- **Recommendation**: GO
- **Overall Readiness**: 95%
- **Deployment Risk**: Low
- **Blockers**: 0  Concerns: 2  Recommendations: 2

The build is verified working end-to-end: `npm run build` succeeds, produces correctly base-path-prefixed asset references (`/skill-flip/...`) in `dist/index.html`, and copies `data/glossary.json` into `dist/data/`. The GitHub Actions workflow (`.github/workflows/deploy.yml`) follows the correct order (checkout → npm ci → validate-glossary → build → configure-pages → upload-artifact → deploy) using GitHub's native OIDC-based Pages deployment, which requires zero secrets/PATs. `src/main.ts` renders a visible, styled error state (`.app-error`) on any fetch/parse/empty-array failure rather than a silent blank screen, and this is covered by 3 dedicated tests. All 43 Vitest tests + 2 build-verification checks pass; `tsc -b --noEmit` is clean. No secrets or `.env` files are present in the repo; `.gitignore` correctly excludes `.env*`. No external CDN/font/script dependencies — the bundle is fully self-contained.

The two concerns below (a single `innerHTML` usage on repo-controlled content, and the two pre-existing/documented known items) do not block deployment for a resume-style static content app with no user input surface.

## Category Breakdown
(Categories re-scoped for a static-site deployment; server-only categories from the generic checklist are marked N/A.)

| Category | Score | Status |
|----------|-------|--------|
| Build & Configuration | 100% | Pass — build succeeds, base path correct, no secrets committed |
| Deployment Pipeline | 95% | Pass — workflow correct; live deploy unconfirmed (expected, no remote configured yet) |
| Client-Side Error Handling | 100% | Pass — visible error state, tested |
| Static-Site Security | 90% | Pass with 1 minor concern — one unescaped `innerHTML` interpolation |
| Dependency Hygiene | 85% | Pass with known, accepted concern — 5 transitive devDependency CVEs, documented, `--force` fix deferred |
| Server/Runtime Resilience (rate limiting, pooling, monitoring, CORS, graceful shutdown) | N/A | Not applicable — no server component |

## Blockers (Must Fix)
None.

## Concerns (Should Fix)

1. **Unescaped HTML interpolation in `Card.ts`**
   - **Location**: `src/components/Card.ts:207`
   - **Issue**: `plTerm.innerHTML = \`PL: <strong>${entry.translationPl}</strong>\`;` builds an HTML string via template literal and assigns via `innerHTML`, while every other field on the same component (`term`, `description`, `descriptionPl`, badges) correctly uses `textContent`. `content-pipeline/validate-glossary.ts` validates field presence/type/shape only — it does not escape or reject HTML-special characters in string fields. Since `data/glossary.json` is repo-controlled content (not user-submitted at runtime), the practical risk is low (would require a malicious/careless edit to the content file to land, e.g. via a PR), but it is an inconsistency in an otherwise textContent-safe codebase and a static-site-appropriate hygiene gap worth closing before scaling up content authoring.
   - **Suggestion**: Replace with a `textContent`-based construction, e.g. set the "PL:" label and a `<strong>` child element's `textContent` separately, or use `element.append('PL: ', strongEl)`. Fixable: true.

2. **Live GitHub Pages deploy unconfirmed** *(explicitly flagged as known/non-blocking per task context, included here for completeness)*
   - **Location**: `.github/workflows/deploy.yml`, repo has no `git remote` configured in this sandbox
   - **Issue**: The workflow itself is correct (verified structurally: correct trigger, permissions block for OIDC `id-token: write`/`pages: write`, correct job order, `actions/deploy-pages@v4`), but has never actually run against a live GitHub Pages environment, since no remote exists yet. Also requires a one-time manual step (enabling "GitHub Actions" as the Pages source under repo Settings → Pages) that cannot be verified from the sandbox.
   - **Suggestion**: On first push to a real `main` branch with a configured remote, confirm the Actions run succeeds and the Pages source setting is enabled. Fixable: true (by the person doing the first push, not by code changes).

## Recommendations (Nice to Have)

1. **Transitive devDependency vulnerabilities** *(explicitly flagged as known/accepted per task context)*
   - `npm audit` reports 5 vulnerabilities (3 moderate, 1 high, 1 critical), all rooted in `esbuild <=0.24.2` pulled in transitively via `vite`/`vitest`/`vite-node`/`@vitest/mocker`. These affect the **dev server only** (esbuild's dev-server CORS issue, GHSA-67mh-4wv8-2f99) and are not present in the shipped static `dist/` output. The available fix (`npm audit fix --force`) would force-upgrade to `vite@8.1.2`, a breaking major-version change, reasonably deferred rather than rushed in. No action needed before this deployment; worth revisiting opportunistically during a future dependency-maintenance pass.

2. **No `package.json` `engines` field**
   - The CI workflow pins Node 22 explicitly, so this doesn't cause a version-drift risk in practice, but adding an `engines.node` constraint would make the requirement self-documenting for future local contributors.

## Verification Evidence

- `npm run build` — succeeds; `dist/index.html` shows `crossorigin src="/skill-flip/assets/index-*.js"` and `crossorigin href="/skill-flip/assets/index-*.css"` (correct base-path rewriting), `dist/data/glossary.json` present and populated.
- `npm test` — 9 test files, 43 tests passed; `scripts/verify-build.test.ts` (2 checks: dist paths prefixed correctly, `vite.config.ts` exports `base: "/skill-flip/"`) passed.
- `npm audit` — 5 vulnerabilities, all transitive devDependency (esbuild/vite/vitest chain), matches work-log's documented, accepted risk exactly.
- `git status` / `git remote -v` — repo initialized, no remote configured (consistent with task context); no `.env*` files found; no hardcoded secret/API-key/password/token patterns found in tracked source via pattern grep.
- `grep -rn "innerHTML" src/` — 12 matches; 11 are either clearing content (`innerHTML = ''`) or a static HTML entity (`&middot;`), both harmless; 1 (`Card.ts:207`) interpolates data-file content into an HTML string, the only real finding.
- `grep -rn "http://\|https://" src/ index.html theme.css` — no matches; confirms no external CDN/font/script dependency, fully self-contained bundle.

## Next Steps

1. (Optional, before next content-authoring pass) Fix `Card.ts:207` to use `textContent`/DOM-append instead of `innerHTML` for the `translationPl` field.
2. On first real push: verify GitHub Actions run succeeds and enable "GitHub Actions" as the Pages source in repo Settings → Pages.
3. (Opportunistic) Revisit `npm audit` devDependency chain during a future routine maintenance pass, once a non-breaking upgrade path exists.

---

## Structured Result

```yaml
status: "ready"
recommendation: "GO"
report_path: ".maister/tasks/development/2026-07-01-skill-flip-engineering-lexicon/verification/production-readiness-report.md"

overall_readiness: 95
deployment_risk: "low"

categories:
  build_configuration: { score: 100, status: "pass" }
  deployment_pipeline: { score: 95, status: "pass" }
  client_side_error_handling: { score: 100, status: "pass" }
  static_site_security: { score: 90, status: "pass_with_concern" }
  dependency_hygiene: { score: 85, status: "pass_with_known_concern" }
  server_runtime_resilience: { score: null, status: "not_applicable" }

issues:
  - source: "production_readiness"
    severity: "warning"
    category: "security"
    description: "Card.ts uses innerHTML with template-literal interpolation of entry.translationPl instead of textContent, inconsistent with the rest of the component's safe textContent usage"
    location: "src/components/Card.ts:207"
    fixable: true
    suggestion: "Replace innerHTML assignment with textContent-based construction (e.g. append a <strong> child element with textContent set separately)"
  - source: "production_readiness"
    severity: "info"
    category: "deployment"
    description: "Live GitHub Pages deploy unconfirmed — no git remote configured yet in this sandbox; workflow structure verified correct but never executed against a live Pages environment"
    location: ".github/workflows/deploy.yml"
    fixable: true
    suggestion: "On first push to a real remote's main branch, confirm the Actions run succeeds and enable GitHub Actions as the Pages source under repo Settings > Pages"
  - source: "production_readiness"
    severity: "info"
    category: "security"
    description: "npm audit reports 5 vulnerabilities (3 moderate, 1 high, 1 critical) in transitive devDependencies (esbuild via vite/vitest chain), affecting dev server only, not the shipped dist/ output"
    location: "package.json / package-lock.json (devDependencies)"
    fixable: true
    suggestion: "Defer until a non-breaking fix path exists; npm audit fix --force currently forces a breaking vite@8 upgrade"

issue_counts:
  critical: 0
  warning: 1
  info: 2
```
