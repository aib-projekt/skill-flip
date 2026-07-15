# Phase 2 Scope Decisions

## TL;DR
All 4 gap-analyzer decisions resolved with the recommended option: the cross-reference audit expands (8 new pairs + systematic term-diff before each batch, especially Batch 3), existing entries MAY be edited for "See also" notes (resolving the spec's Section 1.4 vs Section 2 contradiction), Batch 2's communication-strategy decision tree splits into 4 entries, and execution pauses for a spot-check after Batch 1 before continuing to Batches 2-3.

## Key Decisions
- **Cross-reference scope expanded**: known-overlaps table grows from 13 to 21 pairs (8 newly found: CQRS/Circuit Breaker/Event Sourcing reclassified as 3-way not 2-way; Saga Pattern, API Gateway, Aggregate, Consumer-Driven Contract Testing, Externalized Configuration added). A systematic term-list diff (new source terms vs. all 159 existing entries) runs before/during each batch, with particular attention to Batch 3 (unchecked, Polish, largest).
- **Existing-entry edits authorized**: Section 2/Phase-1-clarifications' cross-reference mechanism takes precedence over Section 1.4's literal "purely additive" wording. Existing entries (~21 across Software Engineering, API Development, Spring/JEE, Testing) get a short "See also" sentence appended to `description`/`descriptionPl` — no other change to their existing text/meaning.
- **Batch 2 decision tree splits into 4 entries**: simple polling, SSE, WebSocket, WebRTC each become independent `GlossaryEntry` records rather than one bundled entry.
- **Checkpoint after Batch 1**: implementation pauses for a spot-check once Batch 1 (`microservice-patterns.md`, ~49-57 entries after splitting) is curated and validated, before Batches 2-3 proceed.

## Open Questions / Risks
- None outstanding — all 4 decisions resolved with the recommended option.

---

## Decision Log

| # | Issue | Resolution |
|---|---|---|
| Critical 1 | Cross-reference overlap list incomplete (8+ pairs missing, Batch 3 unchecked) | Expand list now + systematic term-diff per batch (Recommended) |
| Critical 2 | Spec self-contradiction: Section 1.4 vs Section 2 on existing-entry edits | Section 2/clarifications wins — edit existing entries for See-also notes (Recommended) |
| Important 1 | Batch 2 decision-tree granularity | Split into 4 separate entries (Recommended) |
| Important 2 | Session/execution checkpoint structure | Pause after Batch 1 for spot-check (Recommended) |
