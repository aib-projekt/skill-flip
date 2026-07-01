# Code Review Report

**Date**: 2026-07-01
**Path**: `src/**`, `content-pipeline/**`, `scripts/verify-build.test.ts`, `vite.config.ts`, `vitest.setup.ts`, `.github/workflows/deploy.yml` (Skill Flip — Engineering Lexicon)
**Scope**: all (security, correctness, quality, performance)
**Status**: ⚠️ Issues Found

## Summary
- **Critical**: 1 issue
- **Warnings**: 4 issues
- **Info**: 6 issues

Verification performed independently, not taken on faith from the work-log: ran `npm test` (43 Vitest tests + 2 build checks, all green), `node --experimental-strip-types --test content-pipeline/validate-glossary.test.ts` (5/5 green), and `npx tsc -b --noEmit` (clean). All match the work-log's claims. The documented `BrowseGrid.ts` deviation (Card's tile variant used as a pure state engine, flat DOM hand-built for actual tile rendering) is accepted as intentional per the work-log's Group 4 entry and is **not** flagged below as a finding in itself — only its *side effects* (duplicated badge-class logic) are.

---

## Critical Issues

### 1. Unescaped interpolation into `innerHTML` — stored-XSS-shaped pattern in `Card.ts`
**Location**: `src/components/Card.ts:207`
```ts
plTerm.innerHTML = `PL: <strong>${entry.translationPl}</strong>`;
```
**Risk**: `entry.translationPl` is interpolated directly into an HTML string and assigned via `innerHTML`, with no escaping. Every other text field in the codebase (`term`, `description`, `descriptionPl`, category/level badges, tile content, progress stats) is correctly set via `.textContent`, so this line is the one exception. Today's data source (`data/glossary.json`) is a hand-curated, reviewed static file, so there is no live attacker-controlled input reaching this sink in the current build — that is why it hasn't manifested as an exploitable bug yet. But:
- The spec's own stated roadmap is to grow this dataset via `content-pipeline`'s AI-assisted authoring path (prompt template → LLM output → hand review → merge). Any future content-authoring slip (a translation string that happens to contain `<`/`>`/`"` from copy-paste, an un-reviewed batch import, or a future CMS/contribution-form front-end for community-submitted terms) turns this into a genuine injection sink with no code change required to trigger it.
- It is also the only place in the component layer that deviates from the project's own "textContent, never innerHTML for data" pattern, so it reads as an oversight rather than a deliberate choice — nothing in `Card.ts`'s comments explains why this one field needs HTML.
- The `<strong>` wrapper is cosmetic (bolding "PL:"); it does not require interpolating the whole string as HTML.
**Recommendation**: Build this node with DOM APIs instead of an HTML string, e.g.:
```ts
plTerm.textContent = '';
const label = document.createElement('strong');
label.textContent = entry.translationPl;
plTerm.append('PL: ', label);
```
This removes the injection vector entirely while preserving the same visual output, and brings this line in line with every other rendering call in the file.

---

## Warnings

### 2. Duplicated category-badge-class logic between `Card.ts` and `BrowseGrid.ts`
**Location**: `src/components/Card.ts:54-56` (`categoryBadgeClass`) vs. `src/components/BrowseGrid.ts:154`
```ts
// Card.ts
function categoryBadgeClass(category: GlossaryEntry['category']): string {
  return `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

// BrowseGrid.ts (createTile), re-implemented inline instead of imported:
badge.className = `badge cat-${entry.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
```
**Why it matters**: This is byte-for-byte the same slugification logic, copy-pasted rather than shared. It's a natural side effect of the documented Group 4 deviation (tile DOM is hand-built, not Card's own DOM), but the slug function itself has no reason to be duplicated — it doesn't depend on Card's internal DOM structure at all. If the slugification rule ever changes (e.g. a new category is added whose name doesn't slugify cleanly), one of the two copies will silently drift from the other.
**Recommendation**: Export `categoryBadgeClass` (and optionally `levelBadgeClass`) from `Card.ts`, or better, hoist both into a small shared helper (e.g. `src/lib/badges.ts`) that both `Card.ts` and `BrowseGrid.ts` import. Low-risk, mechanical fix.

### 3. Duplicated progress-stats rendering markup between `BrowseGrid.ts` and `LearnMode.ts`
**Location**: `src/components/BrowseGrid.ts:44-69` (`renderProgressStats`) vs. `src/components/LearnMode.ts:91-117` (`renderProgressStats`)
**Why it matters**: Both functions are near-identical: call `computeBucketCounts`, clear the container, build `span.stat.know` / `span.dot` / `span.stat.dontknow` / `span.dot` / `span.stat.unseen` and append them in the same order. The spec explicitly calls out that the *counting* logic (`computeBucketCounts`) must be shared (and it correctly is, via `storage.ts`), but the *rendering* of those counts into DOM is duplicated across the two view components. This isn't the flagged/accepted BrowseGrid deviation — it's a separate, unflagged duplication that would be easy to consolidate.
**Recommendation**: Extract a small `renderProgressStats(container: HTMLElement, entries: Glossary): void` helper (e.g. in a new `src/components/ProgressStats.ts` or as an exported function from `storage.ts`'s "view" concerns) that both `BrowseGrid.ts` and `LearnMode.ts` call. Not urgent given the app's current size, but worth doing before a third topbar variant is ever added.

### 4. `LearnMode.ts` re-derives flip state via generic DOM event listening instead of an explicit state-change callback
**Location**: `src/components/LearnMode.ts:189-197`
```ts
card.element.addEventListener('click', () => renderMarkRow());
card.element.addEventListener('keydown', (e: Event) => {
  const key = (e as KeyboardEvent).key;
  if (key === ' ' || key === 'Spacebar') renderMarkRow();
});
```
**Why it matters**: This works today (documented and intentional, per the Group 5 work-log note about staying within file scope) but is fragile: it re-renders `.mark-row` on **every** click inside the card, including clicks that don't flip anything (e.g. clicking the "(i)" info button, which calls `e.stopPropagation()` in `Card.ts` but the `click` listener is on `card.element`, a `Card.ts`-external ancestor, so propagation still reaches it via bubbling from `infoBtn` before `stopPropagation` takes effect at the `infoBtn` listener itself — actually verified: `stopPropagation` is called synchronously in the same handler that fires before bubbling continues, so it does correctly prevent this listener from firing for info-button clicks). The more real fragility is that this couples `LearnMode.ts` to `Card.ts`'s internal DOM structure and event dispatch pattern (`toggleFlip` via `.flip-trigger` clicks) without any type-level guarantee; a future change to `Card.ts` (e.g. adding a new clickable child, or changing the flip trigger's event type) could silently break `.mark-row` visibility without any test failure pointing at the real cause, since the tests assert on the *symptom* (`.mark-row` presence) rather than the mechanism.
**Recommendation**: Consider adding an optional `onFlipChange?: (isFlipped: boolean) => void` callback to `CreateCardOptions` (mirroring the existing `onNavigate`/`onSwipe` pattern already in `Card.ts`) and have `LearnMode.ts` use that instead of DOM-event sniffing. Not blocking — current tests do pass and cover the observable behavior — but worth doing if `Card.ts` gains more interactive children.

### 5. `npm audit` vulnerabilities in devDependencies acknowledged but not tracked anywhere actionable
**Location**: `package.json` (devDependencies: `vite`, `vitest`, `jsdom`, `typescript`, `@types/node`)
**Why it matters**: The work-log (Group 1) notes "`npm audit` reports 5 vulnerabilities (3 moderate, 1 high, 1 critical) in transitive devDependencies... not addressed... flagged for awareness." Dev-only transitive vulnerabilities in a build toolchain are genuinely low risk for a static, client-only site (they don't ship to production, and this app has no server), but a "1 critical" finding sitting undocumented outside a work-log entry (which isn't typically re-read once the task closes) is easy to lose track of. Confirmed present as of this review — re-running `npm audit` is worth doing periodically since the report may change as the vite/vitest lines get patched upstream.
**Recommendation**: Either resolve with a scoped `npm audit fix` (test that it doesn't break the vite 5 / vitest 2 pairing before accepting) or, if deferring, add a one-line note to `README.md` or a `SECURITY.md`/`TODO` so it's visible outside the (eventually stale) work-log.

---

## Informational

### 6. `content-pipeline/validate-glossary.ts` duplicates `Category`/`Level` enums by hand instead of any shared source of truth
**Location**: `content-pipeline/validate-glossary.ts:19-36` vs. `src/types/glossary.ts:10-24`
**Why it matters**: This is explicitly documented as an intentional decoupling decision (content-pipeline must not import from `src/` so it isn't bundled into the Vite build), and is a reasonable tradeoff for a tool this size. The only residual risk is exactly what the file's own comment says: if `Category`/`Level` change in `src/types/glossary.ts`, someone has to remember to update this file by hand, and nothing will fail loudly if they forget except a validator that's silently out of sync with the real type. Low risk today given the small team/size of this codebase.
**Suggestion**: If the taxonomy changes more than once or twice, consider generating both from a single JSON/YAML source of truth (or a lightweight codegen script) rather than two hand-maintained copies. Not worth doing now.

### 7. `applyMark`'s docstring doesn't fully state the "already know" case
**Location**: `src/lib/learnAlgorithm.ts:76-95`
**Why it matters**: `applyMark(current, 'know')` when `current.bucket === 'know'` still increments `consecutiveKnowCount` past `GRADUATION_THRESHOLD` (e.g. 1, 2, 3, 4...) since there's no reset/cap once a card is already in `know`. This is harmless in practice — `bucketOf` only ever reads `.bucket`, and `consecutiveKnowCount` is only consulted while transitioning *into* `know` from `dont_know`/`unseen` — but the unbounded counter is a latent inconsistency (a `know`-bucket card's `consecutiveKnowCount` can grow arbitrarily large with no functional purpose once graduated). Verified via test (`learnAlgorithm.test.ts`) that this doesn't cause any observable bug today.
**Suggestion**: Optional cleanup — early-return `current` unchanged (or cap the counter at `GRADUATION_THRESHOLD`) when `current.bucket === 'know'` and mark is `'know'`, purely for clarity/data hygiene, not correctness.

### 8. `BrowseGrid.ts` and `FilterBar.ts` rebuild entire DOM subtrees on every state change via `innerHTML = ''` + re-append
**Location**: `src/components/BrowseGrid.ts:151,202`, `src/components/FilterBar.ts:94,132`
**Why it matters**: Every chip toggle, level change, or debounced search re-render clears and rebuilds the chip list / grid / tile from scratch rather than diffing. For a ~20-entry dataset (and even the eventual ~150-term target) this is functionally invisible — no perf concern at this scale, correctly out of scope per the review brief's own framing. Flagged only as a note for awareness, not an action item: if this pattern is reused for something with a much larger N (e.g. if Browse's grid were ever backed by a paginated API), this rebuild-everything approach would need revisiting.
**Suggestion**: No action needed now; worth a comment for future maintainers if the dataset size assumption ever changes materially.

### 9. `Card.ts`'s `render()` unconditionally resets `translationPop.style.display` inline, fighting CSS-based show/hide elsewhere
**Location**: `src/components/Card.ts:214-216`
```ts
infoBtn.classList.toggle('active', state.isTranslationVisible);
translationPop.classList.toggle('is-visible', state.isTranslationVisible);
translationPop.style.display = state.isTranslationVisible ? '' : 'none';
```
**Why it matters**: Both a `classList.toggle('is-visible', ...)` (presumably CSS-driven) and a redundant inline `style.display` are used to control visibility of the same element. If `theme.css` already has an `.translation-pop.is-visible { display: ... }` rule (worth double-checking), the inline style is dead weight that could fight a future CSS change (inline styles win specificity battles over class-based rules unless `!important` is used). Not a functional bug today — tests pass and the combination happens to agree — but a "belt and suspenders" pattern that's a minor maintenance trap.
**Suggestion**: Pick one mechanism (prefer the class-based one, since it composes with `prefers-reduced-motion` and any future transition rules in `theme.css` more cleanly) and drop the inline `style.display` line.

### 10. Category badge colors: only steel/navy semantic aliases exist, no per-category theme.css rules
**Location**: `src/styles/theme.css` (no `.cat-java`, `.cat-devops`, etc. rules found anywhere in the file)
**Why it matters**: The work-log (Group 2) states "only 2 of 12 category badge colors exist in theme.css so far... Group 4/5 will need to extrapolate the rest," but as of this review, a search for `.cat-` in `theme.css` finds zero per-category color rules at all (only `.cat-chips`, the filter bar's chip *container* class, which is unrelated). All category badges currently render with the same generic `--bg-badge-category` (steel) background regardless of category. This is explicitly called out in `spec.md` as an implementation-time detail left open ("Per-category badge-color mapping... implementation-time details the spec itself leaves open"), so this is **not a defect against the spec** — flagged purely as an accuracy note against the work-log's own claim, and as a nice-to-have for visual polish once more categories have real content.
**Suggestion**: No action required for this pass; worth revisiting once the ~150-term/12-category dataset lands and category differentiation in Browse actually matters visually.

### 11. `serveRootData` Vite plugin's dev-server URL rewrite has no path-traversal guard
**Location**: `vite.config.ts:14-24`
```ts
server.middlewares.use((req, _res, next) => {
  if (req.url?.startsWith('/data/')) {
    req.url = `/@fs${resolve(rootDir, req.url.slice(1))}`;
  }
  next();
});
```
**Why it matters**: `resolve(rootDir, req.url.slice(1))` will happily resolve `../../../etc/passwd`-style traversal segments if a request path contains them (e.g. `/data/../../../../etc/passwd`), potentially serving arbitrary files from the dev machine's filesystem via Vite's `/@fs` mechanism. This is **dev-server-only** code (`configureServer` never runs in the production `dist/` build, confirmed via `closeBundle`'s separate, safe `copyFileSync` path that only ever touches the fixed `data/glossary.json` file), so the blast radius is limited to "someone on your local network can hit your `npm run dev` port during development" — not a production vulnerability. Still worth a defensive fix since dev servers are sometimes bound to `0.0.0.0` or exposed via tunnels (ngrok, Codespaces, etc.) during demos, which is a plausible scenario for a portfolio project meant to be shown to recruiters.
**Suggestion**: Validate the resolved path stays within `rootDir` before rewriting, e.g.:
```ts
const target = resolve(rootDir, req.url.slice(1));
if (!target.startsWith(rootDir + sep)) { next(); return; }
req.url = `/@fs${target}`;
```

---

## Correctness Verification (learn algorithm, storage round-trip)

Independently re-derived (not just trusting the work-log) and confirmed correct by reading `learnAlgorithm.ts`/`storage.ts` line-by-line plus re-running the test suite:

- **Weighted pool construction** (`buildWeightedPool`): correctly repeats each candidate entry `BUCKET_WEIGHTS[bucket]` times in a flat array, defaulting unseen entries to weight 2 via `bucketOf`'s `?? 'unseen'` fallback. `Math.floor(Math.random() * pool.length)` is a standard, correct uniform pick over the flat pool, giving `dont_know` (weight 4) cards a proportionally higher draw chance than `know` (weight 1) cards — test `learnAlgorithm.test.ts:19-41` empirically confirms this over 500 draws.
- **Previous-card exclusion**: `excludeId !== null && entries.length > 1` correctly falls back to including the excluded card only when it's the sole remaining entry (`entries.length <= 1`), matching spec Section 4's stated behavior and covered by test.
- **Graduation/demotion** (`applyMark`): a single `'dont_know'` mark unconditionally resets to `{ bucket: 'dont_know', consecutiveKnowCount: 0 }` regardless of prior state (immediate demotion, matches spec); two consecutive `'know'` marks correctly graduate `dont_know`→`know` via the `>= GRADUATION_THRESHOLD` check and reset the counter. Edge case noted in Info #7 above (unbounded counter once already in `know`) is cosmetic, not a correctness bug.
- **Uniform-random fallback when all cards are `know`**: correctly falls out of the same weighted-pool code path with no special-casing (all weights become 1, so the pool is just one copy of each entry) — test confirms roughly uniform distribution across all entries.
- **`storage.ts` round-trip**: `writeProgress` correctly reads-merges-writes the full map (read-modify-write, not a partial update), `readProgress` correctly guards against missing key, non-JSON, and non-object parsed values (all default to `{}` without throwing), and `computeBucketCounts` correctly defaults unrecorded entries to "new," matching the draw algorithm's own default. Verified against `storage.test.ts`'s 3 tests, all passing.
- **`main.ts`'s fetch→validate→mount flow**: correctly treats a non-`ok` response, a rejected fetch promise, and a `[]`-but-`ok` response as equivalent failure states, all rendering the visible `.app-error` block rather than a blank screen — matches the spec's "fails loudly" requirement and is covered by `main.test.ts`'s 3 tests (independently re-run, all pass).

No correctness defects found in the learn algorithm or storage layer.

---

## Metrics
- Files analyzed: 24 TypeScript/config source files (`src/**`, `content-pipeline/*.ts`, `scripts/verify-build.test.ts`, `vite.config.ts`, `vitest.setup.ts`) + 1 CI YAML.
- Max function length: `createCard` (`Card.ts`) ~240 lines including nested closures — long but is the single shared component per spec's own design (front/back DOM construction + render + handlers all colocated); not flagged as a "long function" defect given the deliberate single-file-per-component structure and 100% test coverage of its behavior.
- Max nesting depth: 3 levels (well within the 4-level threshold) — no deep-nesting findings.
- Functions with >5 parameters: none found (all component factories use a single options object).
- Potential XSS/injection vulnerabilities: 1 (`Card.ts:207`, Critical #1).
- Path-traversal risk: 1 (dev-only, `vite.config.ts`, Info #11).
- N+1 query risks: not applicable (no database, no network calls beyond the single glossary fetch).
- Console.log/debug statements left in shipped code: none found in `src/` (only `console.error` in `main.ts`'s catch block, which is appropriate error logging, and `content-pipeline`/`scripts` CLI tools' expected `console.log`/`console.error` output).
- Test suite (independently re-run): 43 Vitest tests + 2 Node-native build checks + 5 content-pipeline checks = 50, all passing. `npx tsc -b --noEmit`: clean.
- `data/glossary.json`: 20 entries, 0 duplicate ids (independently verified via script), all `category: "Java"`, levels split across Regular/Senior — matches spec's stated starter-scope decision.

---

## Prioritized Recommendations
1. **Fix the `innerHTML` interpolation in `Card.ts:207`** (Critical #1) — swap to DOM-API construction (`textContent` + a `<strong>` element). Small, mechanical, removes the one real injection-shaped sink in the codebase before the content pipeline scales to AI-assisted authoring of 130+ more entries.
2. **Consolidate the duplicated category-badge-slug logic** (Warning #2) by exporting `categoryBadgeClass` from `Card.ts` (or hoisting to a shared helper) and importing it in `BrowseGrid.ts`.
3. **Consolidate the duplicated progress-stats rendering** between `BrowseGrid.ts` and `LearnMode.ts` (Warning #3) into one shared render helper.
4. **Add a path-traversal guard to `serveRootData`'s dev middleware** (Info #11) — low effort, closes a dev-only but real gap, worth doing before any live demo/screen-share of `npm run dev`.
5. Consider replacing `LearnMode.ts`'s generic click/keydown DOM sniffing with an explicit `onFlipChange` callback on `Card.ts` (Warning #4) if `Card.ts` grows more interactive children in a future pass.
6. Track the existing `npm audit` findings somewhere more durable than a work-log entry (Warning #5), or resolve them if a compatible patch exists.
7. Everything else (Info #6, #7, #8, #9, #10) is optional polish, correctly low-priority given the app's current scale and the explicit scope decisions already documented in `spec.md`.
