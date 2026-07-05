# Production Readiness Report

**Date**: 2026-07-05
**Path**: `.maister/tasks/development/2026-07-04-learn-filtered-subset` (feature: `skillflip:browse-filter-state` localStorage persistence, `src/lib/storage.ts` + `AppShell`/`FilterBar`/`BrowseGrid`/`LearnMode` consumers)
**Target**: production (static Vite SPA, GitHub Pages, zero backend, zero runtime dependencies)
**Status**: Ready

## Executive Summary

- **Recommendation**: GO
- **Overall Readiness**: 95%
- **Deployment Risk**: Low
- **Blockers**: 0  Concerns: 2  Recommendations: 2

This is a small, additive, client-only change (new localStorage key + wiring through 4 existing components, no new dependencies, no build/deploy pipeline changes). It follows the exact same unguarded-`localStorage` pattern already shipped and running in production for Learn Mode progress (`readProgress`/`writeProgress`), so it introduces no *new* class of risk — it only extends an accepted, pre-existing one. Verified empirically: full test suite (63/63) and production build both pass cleanly on the current working tree.

Standard categories like "monitoring," "rate limiting," and "connection pooling" are largely inapplicable to a static client-only site and are scored/noted as N/A rather than penalized, per this project's documented architecture (zero backend, zero runtime dependencies, by design — see `.maister/docs/project/tech-stack.md`).

## Category Breakdown

| Category | Score | Status |
|----------|-------|--------|
| Configuration | 100% | N/A — no env vars, secrets, or server config exist in this client-only change |
| Monitoring | 60% | Pre-existing gap, not worsened by this change (see below) |
| Resilience | 85% | One concern: unguarded `localStorage.setItem` in the new write path |
| Performance | 100% | N/A — no new network calls, no bundle-size concern (JSON blob, synchronous localStorage) |
| Security | 100% | No secrets, no new attack surface; data is non-sensitive (category/level filter selection) |
| Deployment | 100% | Zero changes to `package.json`, `vite.config.ts`, or `.github/workflows/deploy.yml`; build and full test suite verified green |

## Blockers (Must Fix)

None.

## Concerns (Should Fix)

1. **`writeFilterState()` does not catch `localStorage.setItem` exceptions** (`src/lib/storage.ts:102-110`)
   - **Issue**: `localStorage.setItem(FILTER_STATE_KEY, ...)` is called with no try/catch. In Safari private browsing (older versions) and any browser at storage quota, `setItem` throws (`QuotaExceededError` / `SecurityError`). This call sits inside a synchronous UI event chain — chip/level click → `FilterBar.onChange` → `BrowseGrid.onFilterChange` → `AppShell.handleFilterChange` → `writeFilterState` (`src/components/AppShell.ts:68-80`) — so a thrown exception becomes an uncaught error in a DOM click handler. There is no global `window.onerror`/`unhandledrejection` handler anywhere in the codebase, so the exception is silently swallowed by the browser (logged to devtools console only) and, depending on where it throws relative to `learnMode.updateFilter(...)` in `handleFilterChange`, could leave Learn Mode's card pool out of sync with what Browse displays for that interaction.
   - **Read path is safe**: `readFilterState()` already degrades correctly — absent key, malformed JSON, and non-object-parsed values are all defensively handled and fall back to `defaultPersistedFilterState()` (verified by `storage.test.ts:111-122`, and confirmed passing against the real jsdom Storage implementation, not a mock).
   - **Context**: this is not a regression — `writeProgress()` (`src/lib/storage.ts:71`, pre-existing, used throughout `LearnMode.ts`'s `mark()`) has the identical unguarded pattern and already ships in production today. This PR is consistent with, not worse than, existing shipped behavior.
   - **Fixable**: true — wrap both `setItem` calls in try/catch, swallow-and-continue (matches this project's "session-only fallback" philosophy already used on the read side). Low effort, mirrors the read-side pattern already in the same file.

2. **No global error boundary for post-bootstrap runtime errors** (`src/main.ts:28-52`)
   - **Issue**: `main.ts`'s `bootstrap()` only wraps the initial glossary fetch/parse in try/catch and renders a visible `.app-error` state on failure. Any error thrown later — during a filter change, a mark action, etc. (including the `writeFilterState` case above) — has no equivalent user-facing surface. The user would see a frozen/stale UI with no in-app indication anything went wrong; only the browser devtools console would show it.
   - **Context**: this is a pre-existing architectural gap (not introduced by this feature) but this feature is the first to add a *new* write path (`writeFilterState`) that could realistically throw in a normal user flow (quota exhaustion is more plausible over time as more localStorage keys accumulate: `skillflip:learn-progress` + `skillflip:browse-filter-state`). Worth a mention here since it compounds with Concern 1.
   - **Fixable**: false at the scope of this task — a global error boundary is a cross-cutting architectural addition, not a one-line fix for this feature. Reasonable to defer.

## Recommendations (Nice to Have)

1. **Consider a durable fix for the `storage.test.ts` jsdom/Node localStorage-shadowing workaround.** Already flagged in this task's own work-log (`implementation/work-log.md`, Wave 5 notes) as a known, accepted, out-of-scope item — a Vitest setup file or `NODE_OPTIONS=--no-experimental-webstorage` would remove the `beforeAll` re-pointing hack in `storage.test.ts:17-36`. Does not affect production code; test-infrastructure cleanliness only.
2. **If/when a third localStorage key is added in the future**, consider centralizing a small `safeSetItem(key, value)` helper in `storage.ts` rather than repeating the unguarded pattern a third time — at that point the duplication (not the risk itself) becomes the more actionable signal, per this project's DRY standard (`standards/global/coding-style.md`).

## Monitoring/Observability Assessment (explicit call-out per request)

This project has zero monitoring/error-tracking/metrics by design (confirmed via `.maister/docs/project/tech-stack.md`: "zero runtime dependencies," static SPA, no backend). For this specific change:

- **Not a new problem**: the feature adds one more localStorage key using the exact same read/write idioms as the already-shipped `learn-progress` key. It does not introduce a new category of unobserved failure — it extends an existing, accepted one.
- **Acceptable for this project's context**: this is a personal study tool + portfolio piece with no user base to page an on-call engineer for, no SLA, and no backend to instrument. Adding Sentry/analytics purely to catch a `QuotaExceededError` on a ~100-byte JSON blob would be disproportionate to the project's actual scale and would itself be flagged by this project's own pragmatic/over-engineering standards.
- **Verdict**: monitoring gap is pre-existing and acceptable; not a blocker for this change. The one actionable item is Concern 1 (catch-and-degrade on write), which is a two-line code change, not a monitoring/observability investment.

## Build & Deploy Pipeline Impact

- **Files touched by this feature**: `src/lib/storage.ts`, `src/lib/storage.test.ts`, `src/components/{AppShell,BrowseGrid,FilterBar,LearnMode}.ts` + their `.test.ts` files, `src/components/EmptyState.ts` (new), `src/styles/theme.css`. Confirmed via `git status`.
- **Untouched**: `package.json` (no new dependencies), `vite.config.ts`, `.github/workflows/deploy.yml`. Confirmed via diff inspection.
- **Empirically verified this session**:
  - `npm test` → 63/63 vitest tests passed across 10 files, plus 2/2 `test:build` checks (dist output exists, asset paths correctly prefixed with `/skill-flip/` base path) — all green.
  - `npm run build` → `tsc -b && vite build` completes cleanly, output is a 17.86 kB JS / 8.62 kB CSS bundle (gzip: 5.63 kB / 2.22 kB) with no warnings or errors.
- **Conclusion**: zero pipeline risk. The GitHub Actions `deploy.yml` workflow (`npm ci` → `validate-glossary` → `build` → upload → deploy) requires no modification and will succeed unchanged.

## Next Steps

1. (Optional, low effort) Add try/catch around the two `localStorage.setItem` calls in `src/lib/storage.ts` (`writeProgress` line 71, `writeFilterState` lines 103-109) so a quota/security exception degrades gracefully (log + continue) instead of throwing into a DOM event handler. Mirrors the defensive pattern already used on the read side in the same file.
2. (Optional, no urgency) Track the pre-existing `storage.test.ts` jsdom-shadowing workaround and the "no global error boundary" gap as separate, non-blocking follow-ups if this project's scope ever grows beyond its current personal-tool/portfolio scale.
3. Ship as-is if the two-line write-side hardening in item 1 is deemed unnecessary for this project's risk tolerance — the existing pattern is already in production for `learn-progress` and has evidently caused no reported issues.

---

## Structured Result

```yaml
status: "with_concerns"
recommendation: "GO"
report_path: ".maister/tasks/development/2026-07-04-learn-filtered-subset/verification/production-readiness-report.md"

overall_readiness: 95
deployment_risk: "low"

categories:
  configuration: { score: 100, status: "not_applicable" }
  monitoring: { score: 60, status: "pre_existing_gap_acceptable" }
  resilience: { score: 85, status: "with_concerns" }
  performance: { score: 100, status: "ready" }
  security: { score: 100, status: "ready" }
  deployment: { score: 100, status: "ready" }

issues:
  - source: "production_readiness"
    severity: "warning"
    category: "resilience"
    description: "writeFilterState() (and pre-existing writeProgress()) call localStorage.setItem with no try/catch; QuotaExceededError/SecurityError in Safari private mode or at storage quota would throw uncaught inside a synchronous DOM click-handler chain (FilterBar -> BrowseGrid -> AppShell.handleFilterChange)."
    location: "src/lib/storage.ts:102-110 (writeFilterState), src/lib/storage.ts:68-72 (writeProgress, pre-existing same pattern)"
    fixable: true
    suggestion: "Wrap both setItem calls in try/catch and swallow-and-continue, mirroring the already-defensive read-side pattern (readFilterState/readProgress) in the same file."
  - source: "production_readiness"
    severity: "info"
    category: "monitoring"
    description: "No global window.onerror/unhandledrejection handler exists; main.ts only catches the initial glossary fetch/parse. A thrown localStorage write error would be silently swallowed by the browser with no user-facing indication."
    location: "src/main.ts:28-52"
    fixable: false
    suggestion: "Out of scope for this feature; a global error boundary is a cross-cutting architectural addition. Consider only if project scope grows beyond personal-tool/portfolio scale."
  - source: "production_readiness"
    severity: "info"
    category: "deployment"
    description: "storage.test.ts uses a beforeAll workaround to re-point window.localStorage due to a Node/jsdom experimental-webstorage shadowing issue; already flagged as accepted/out-of-scope in this task's own work-log."
    location: "src/lib/storage.test.ts:17-36"
    fixable: true
    suggestion: "Add a Vitest setup file or set NODE_OPTIONS=--no-experimental-webstorage at the project config level; test-infrastructure only, does not affect production code."

issue_counts:
  critical: 0
  warning: 1
  info: 2
```
