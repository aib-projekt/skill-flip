# Phase 1 Clarifications

## TL;DR
Full source-fidelity curation confirmed (~109-128 concepts, not capped to the spec's illustrative ~90-110); the 7 newly-found cross-reference pairs get the same "See also" treatment as the spec's original 6; `&` is dropped from id slugs (`microservices-distributed-systems-...`); pre-existing stale docs/test-title wording are left out of this task's scope.

## Key Decisions
- Curate every concept actually found in the 3 source files, not capped to the spec's illustrative estimate — matches the product brief's own "no fixed category-count ceiling" constraint.
- Apply the spec's Section 2.3 "See also" cross-reference policy to 7 additional pairs discovered against existing `Software Engineering` entries (Monolithic/Microservices Architecture, Domain Events, Integration Events, Retry Pattern, Transactional Outbox Pattern, Event Storming, Richardson Maturity Model), on top of the 6 pairs the spec already lists.
- New `id`s in "Microservices & Distributed Systems" drop the `&` entirely: `microservices-distributed-systems-<term-slug>` — consistent with how `Spring/JEE` already drops its punctuation (`spring-jee-...`) rather than spelling it out.
- Stale pre-existing artifacts unrelated to this task (the "12-value enum" test title in `validate-glossary.test.ts`, "159 entries" mentions in `.maister/docs/project/vision.md` and elsewhere) are explicitly left out of scope — they'll be corrected once as part of this task's own doc/count updates at the end, not as a separate mid-task fix.

## Open Questions / Risks
- None outstanding from this round — all four clarifying questions were answered with the recommended option.

---

## Q&A

**Q1: Concept coverage.** Actual source material has ~109-128 curatable concepts vs. the spec's illustrative ~90-110 estimate (Batch 1: 49 actual vs. ~35 estimated).
**A:** Curate everything found (Recommended).

**Q2: Extra cross-refs.** 7 additional cross-reference pairs found beyond the spec's Section 2.3 table.
**A:** Yes, apply the same "See also" policy (Recommended).

**Q3: Id slug for `&`.** No existing precedent for `&` in an id slug.
**A:** Drop the `&` — `microservices-distributed-systems-<term>` (Recommended).

**Q4: Stale docs found.** Pre-existing "12-value enum" test title and "159 entries" doc mentions, unrelated to this task.
**A:** Leave out of scope for now (Recommended) — will be corrected as part of this task's own final entry-count update.
