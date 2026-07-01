# Specification Audit: Skill Flip — Engineering Lexicon

## TL;DR
**Verdict: PASS-WITH-CONCERNS.** The implementation spec faithfully preserves the vast majority of the authoritative feature-spec's concrete detail and correctly resolves the gap-analysis finding with a coherent `AppShell.ts` addition. The Java-only starter-subset scope reduction is stated clearly and repeatedly with no risk of misreading. However: 1 High and 5 Medium severity gaps were found — mainly a dropped debounce-timing detail, an unaddressed mockup contradiction (progress-stats appearing in Browse's topbar too, not just Learn Mode, per the actual HTML), and a few loosely-worded acceptance criteria. No Critical issues — nothing blocks implementation, but two findings (High + Medium) risk a visibly wrong screen if followed literally.

## Key Decisions
- Treated the mockups' literal HTML/CSS (read directly, not just INDEX.md summaries) as the tiebreaker source of truth where spec.md's prose and the mockup markup diverge.
- Scored the "Java-only starter subset" framing as unambiguous — repeated consistently in 4 independent locations (TL;DR, Core Requirement 8, Content Scope section, Success Criteria).
- File-tree/component coherence check passed — `AppShell.ts` integrates cleanly with the Section 7 file tree, no orphaned or contradictory files.

## Open Questions / Risks
- Does AppShell's topbar rendering need to vary per active view (Learn: exit+progress-stats+reset icons; Browse: brand+progress-stats), or is this left to `LearnMode.ts`/`BrowseGrid.ts` independently? — addressed by the fix applied below.
- Is `progress-stats` genuinely meant to be visible on Browse too? — confirmed yes per direct mockup HTML inspection; addressed by the fix applied below.

**Issue counts**: Critical: 0 | High: 1 | Medium: 5 | Low: 4

---

## Findings

### Finding 1 — Search debounce timing (200ms) dropped (Medium)
`feature-spec.md` Section 3 specifies search is "debounced 200ms before applying." `implementation/spec.md`'s Core Requirement 3 and Technical Approach never mention debouncing at all. **Fix applied**: added to Core Requirement 3.

### Finding 2 — progress-stats placement contradiction (High)
Spec's Visual Design table implies `component:progress-stats` appears only in Learn Mode. Direct inspection of `browse-filter-and-grid.html` and `browse-empty-state.html` shows identical `.progress-stats` markup in the Browse `.topbar` too. Since mockups are declared pixel-level binding, silently dropping a visible header element from 2 of 4 screens is a real fidelity gap, and no component/file was assigned ownership for Browse's stats readout. **Fix applied**: clarified ownership and both-view rendering in Core Requirement 5 / New Components table.

### Finding 3 — Per-category badge-color mapping: 9 of 12 categories have zero mockup precedent (Low)
Spec correctly defers exact color assignment as an implementation detail, but only 2 of 12 category badge colors are ever demonstrated in the mockups. Practical exposure is small this pass (Java-only starter subset), but Browse's category chips render all 12 categories with counts. **No spec change required** — flagged for implementer awareness.

### Finding 4 — AppShell topbar ownership not reconciled with per-view topbar differences (Medium)
"AppShell owns the bottom tab bar" could be misread as AppShell owning a single shared topbar too, but the mockups show structurally different topbars per view (Learn: exit+stats+reset icons in a 480px-max container; Browse: brand+stats in a 900px-max "wide" container). **Fix applied**: clarified in Core Requirement 5 that AppShell owns only the bottom tab bar and outer width variant; each view owns its own topbar content.

### Finding 5 — Schema validation rules only fully stated in Success Criteria, not under the content-pipeline requirement (Low)
Information survives in the document but isn't where an implementer would first look. **No spec change required** — organizational issue, not a true gap.

### Finding 6 — Previous-card-exclusion fallback (1-entry pool) has no explicit acceptance criterion (Low)
Prose rule exists (Core Requirement 4) but isn't listed as a testable acceptance criterion. **Fix applied**: added explicit unit-test acceptance criterion.

### Finding 7 — Reset-progress confirmation exact copy dropped (Low)
`feature-spec.md` specifies exact copy ("This clears all learn-mode progress. Continue?"); implementation spec only says "with confirmation." **No spec change required** — copy-level detail explicitly left to implementation discretion elsewhere in the doc; consistent treatment.

### Finding 8 — File tree / component coherence — PASSES
All feature-spec files present in the New Components table; `AppShell.ts` and `config.ts` are legitimately new-but-derived, not invented. No orphaned or contradictory files.

### Finding 9 — Scope-reduction statement — PASSES
Java-only/~15-20-term scope stated consistently and unambiguously across 5 locations. Genuine strength of the spec.

### Finding 10 — Acceptance criteria specificity — mostly strong, 2 mildly vague items (Low)
Progress-stats header location (see Finding 2/4, now fixed) and ".gitignore untouched" verification method were the two soft spots. **Partially addressed** by the Finding 2/4 fix; `.gitignore` verification left as a minor implementation-time check.

---

## Compliance Status: PASS-WITH-CONCERNS → Findings 1, 2, 4, 6 patched into `implementation/spec.md` before proceeding to implementation planning. Findings 3, 5, 7, 10 left as-is (correctly self-aware deferrals or low-risk organizational notes).
