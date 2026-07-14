# Solution Alternatives: New Taxonomy Categories, Dedup Strategy, FilterBar UX, Curation Plan

## TL;DR
Four decision areas, each with 3-5 genuine alternatives: **(1)** how many new categories and how they're named/derived from the 3 source files, **(2)** how to dedup concepts appearing in 2+ sources, **(3)** how FilterBar's chip UI should behave at 14-23 categories instead of 12, and **(4)** how the follow-up curation pass should be sequenced. Recommended package: **source-structure-derived taxonomy** (6 new categories, 18 total) + **merge-into-richest-definition dedup** + **symmetric expand/collapse FilterBar fix** (upgrading to a pinned-chips-plus-dropdown if the category count ends up higher) + **upfront dedup/mapping, then category-at-a-time curation**. All four recommendations are designed to compose together, but each is presented with real alternatives so they can be picked independently in convergence.

## Key Decisions
- **Taxonomy structure**: recommend Alternative B (source-structure-derived, 6 new categories) over a 2-category consolidation or an 11-category maximal split — balances drill-precision against FilterBar/thin-category risk.
- **Dedup strategy**: recommend merging overlapping concepts (CQRS, circuit breaker, service discovery, distributed tracing, etc.) into single richest-definition entries, not first-source-wins or duplicate-with-cross-reference — protects Learn Mode's weighted drill from redundant near-identical cards.
- **FilterBar UX**: recommend adding a genuine "show less" collapse (currently one-way) as the minimum fix regardless of taxonomy outcome; recommend upgrading to a pinned-chips + dropdown pattern only if the final category count lands at Alternative C's high end (~22-23).
- **Curation plan**: recommend resolving all cross-source dedup + category mapping decisions up front (this document + convergence), then curating category-by-category (not source-file-by-source-file) to avoid retrofitting dedup decisions after the fact.

## Open Questions / Risks
- Several category-boundary judgment calls remain even under the recommended alternative (e.g., does "Bounded Contexts" belong under DDD or under Decision-Making & Modeling? dna-mapa files it under the latter) — convergence should confirm or overrule these explicitly.
- Actual entry counts per new category are unknown until curation; sizing estimates in this document are illustrative, not commitments — some new categories may land thinner than expected (a risk this document flags per-alternative).
- The "service discovery" concept has a real granularity mismatch across sources (dna-mapa treats it as one concept, microservice-patterns.md names 5 distinct patterns) — the dedup table below proposes a resolution, but it's a judgment call worth explicit sign-off.
- The FilterBar recommendation is conditional on the taxonomy decision — convergence should confirm final category count before locking the UX alternative.

---

## Decision Area 1: New Category Taxonomy Structure

Constraint baked into every alternative below (per `problem-statement.md` constraint 3): content that clearly fits an existing category — CI/CD, IaC, monitoring, containers, Kubernetes, cloud deployment models (`dna-mapa.md`'s "Infrastruktury" section) and Kafka/Redis/Elasticsearch/Zookeeper/CDN (`system-design terms.md`) — enriches **DevOps** and **Cloud Engineering** rather than becoming a new category, in all three alternatives. What varies is how the *remaining*, genuinely-new-territory content (DDD, architecture styles, distributed-systems theory, decision-making/modeling, and the ~35 microservices patterns) gets grouped.

### Alternative A: Minimal/Consolidated Grouping (2 new categories)

**Description**: Fold nearly all new-territory content into two broad umbrella categories, minimizing FilterBar growth.

- **NEW: "Software Architecture"** — dna-mapa's Aplikacyjna section (DDD building blocks, Transaction Script/Rich/Anemic models, event patterns, Microkernel, Modularization, Hexagonal, Pipes & Filters) *plus* Rozwiązania (ADR, decision process, UML/BPMN/C4, Event Storming, Bounded Contexts, Subdomains, stakeholder mapping).
- **NEW: "Microservices & Distributed Systems"** — dna-mapa's Systemowa section (fallacies of distributed computing, ESB, monolith/modular-monolith/microservices trade-offs, Komunikacja) *plus* all ~35 patterns from `microservice-patterns.md`, collapsing its own 3-way tag split into one category.
- Everything else enriches existing categories: Persystencja (ACID/BASE/DB types/ORM) → Data Storage; Infrastruktury → DevOps/Cloud Engineering; `system-design terms.md` → Data Storage/Cloud Engineering/API Development.

**Resulting taxonomy**: 12 + 2 = **14 categories**.

**Best when**: FilterBar simplicity and minimizing hand-sync surface area (3 unsynced arrays, per `codebase-analysis.md`) outweigh drill precision; or if curation capacity is limited and 2 large categories are easier to fill to a "non-thin" state than 6+ smaller ones.

**Pros**:
- Cheapest FilterBar impact — only 2 more chips, likely still fits within a modestly raised visible-chip count without any UX redesign at all.
- Lowest boundary-judgment overhead (2 categories to define vs. 6-11) and lowest ongoing hand-sync risk (fewest new literals across `glossary.ts`/`FilterBar.ts`/`validate-glossary.ts`).
- No category launches thin — both new categories would combine enough raw concepts (illustratively ~35-45 for "Microservices & Distributed Systems", ~25-30 for "Software Architecture") to look substantial immediately.

**Cons**:
- Discards both source authors' own intentional groupings — `microservice-patterns.md`'s ready-made `#Application patterns` / `#Application Infrastructure patterns` / `#Infrastructure patterns` split (codebase-analysis.md's own flagged "ready-made category split") gets thrown away.
- "Microservices & Distributed Systems" would likely become the single largest category in the entire taxonomy (rivaling or exceeding today's Software Engineering at 32), compressing the Portfolio Visitor's ability to read distinct signaled expertise (e.g. "knows Saga pattern" and "knows API gateway" and "knows deployment strategies" all collapse into one undifferentiated count).
- "Software Architecture" becomes internally heterogeneous — DDD tactical patterns, ADR process, and UML diagram types are meaningfully different study topics bundled under one label, working against the Curator's "drill just this area" goal (personas.md) the week before a themed interview round.

### Alternative B: Source-Structure-Derived Grouping (6 new categories) — user's stated direction

**Description**: Derive category boundaries directly from each source's own natural structure, per `problem-statement.md`'s Key Decision to follow "the source material's own natural groupings rather than an imposed scheme."

- **NEW: "Domain-Driven Design & Architecture Styles"** — dna-mapa's Aplikacyjna minus Persystencja: DDD building blocks, Transaction Script/Rich/Anemic models, event transport/publication patterns, CQRS, Microkernel, Modularization (coupling/cohesion/SOLID/GRASP), Hexagonal, Pipes & Filters.
- **NEW: "Architecture Decision-Making & Modeling"** — dna-mapa's Rozwiązania section as-is: ADR, decision process/metrics/drivers, UML/BPMN/C4, Event Storming (both levels), Bounded Contexts, Ubiquitous Language, Domain/Subdomains, stakeholder mapping.
- **NEW: "Distributed Systems Fundamentals"** — dna-mapa's Systemowa minus Komunikacja: fallacies of distributed computing, costs/reasons for distribution, ESB, Monolith/Modular Monolith/Microservices trade-offs, team-topology considerations.
- **NEW: "Microservices – Application Patterns"** — `microservice-patterns.md`'s `#Application patterns` tag verbatim (~19 patterns: decomposition, data consistency, data architecture, querying, testing, UI composition), dedup'd against category 1 for CQRS/Event Sourcing.
- **NEW: "Microservices – Communication & Reliability"** — merges dna-mapa's Komunikacja subsection (event-driven delivery, design-for-failure, REST maturity, distributed tracing, service discovery, load balancing) with `microservice-patterns.md`'s communication/reliability/observability items from `#Application Infrastructure patterns`, plus `system-design terms.md`'s communication-strategy decision tree — a genuine cross-source merge since both authors independently produced "communication pattern" content.
- **NEW: "Microservices – Discovery & Deployment"** — `microservice-patterns.md`'s `#Infrastructure patterns` tag plus the discovery-specific items from `#Application Infrastructure patterns` (client-side discovery, self-registration): service registry, API gateway, backends-for-frontends, all deployment strategies, mesh, sidecar.
- Persystencja → enrich Data Storage; Infrastruktury → enrich DevOps/Cloud Engineering; `system-design terms.md`'s Kafka/Redis/ES/Zookeeper/CDN → enrich Data Storage/Cloud Engineering (decision tree already folded into category 5 above).

**Resulting taxonomy**: 12 + 6 = **18 categories**.

**Best when**: Drill-precision and source-fidelity matter more than minimizing FilterBar chip count — i.e., when the UX redesign (Decision Area 3) is explicitly in scope to absorb the growth, which it is here.

**Pros**:
- Nearly 1:1 preserves both source authors' own intentional structure — `microservice-patterns.md`'s 3 tags become 3 (regrouped) categories, dna-mapa's top-level headers become distinct categories — directly serving personas.md's Curator "drill just this area" need (DDD tactics vs. ADR/modeling vs. distributed-systems theory are genuinely different pre-interview study sessions).
- Category names read as credible, industry-recognizable terms to the Portfolio Visitor ("Domain-Driven Design & Architecture Styles" signals real breadth at a glance) — directly serves personas.md's secondary persona.
- Illustrative sizing avoids Alternative A's mega-category problem while avoiding Alternative C's thinness risk: rough estimates put each new category in the ~8-20 entry range, comparable to or larger than several *existing* categories (DevOps: 4, Management: 4, Problem Solving: 4, Mentoring: 2).

**Cons**:
- Pushes total categories to 18, meaningfully increasing FilterBar overflow pressure (Decision Area 3 must resolve this — this alternative is the direct reason that decision matters).
- Real boundary-judgment calls remain unresolved by "just follow the source": e.g., dna-mapa files Bounded Contexts under Rozwiązania (Decision-Making) rather than under Aplikacyjna (DDD), which is defensible but not obviously "correct" — a convergence-time confirmation is needed.
- "Architecture Decision-Making & Modeling" and "Distributed Systems Fundamentals" are the two most likely candidates to land thin after actual curation (illustratively ~8-14 entries each) — worth a stated fallback (see Recommendation).

### Alternative C: Maximal/Granular Grouping (10-11 new categories)

**Description**: Split Alternative B's categories further wherever the source material supports a finer cut, maximizing topical precision.

Example split (building on Alternative B): separate "DDD Building Blocks & Tactical Patterns" from "Architecture Styles" (Hexagonal/Microkernel/Pipes&Filters/Modularization); separate "DDD Strategic Patterns" (Bounded Contexts, Ubiquitous Language, Event Storming) from "Architecture Decision-Making" (ADR, metrics, drivers) and again from "Architecture Visualization & Modeling" (UML/BPMN/C4); split "Microservices – Communication & Reliability" into "Communication Patterns" vs. "Reliability & Discovery"; keep "Microservices – Application Patterns" and "Microservices – Deployment & Infrastructure" roughly as in B; optionally carve out a standalone "System Design & Communication Strategy" for `system-design terms.md`'s decision tree instead of folding it into a microservices category.

**Resulting taxonomy**: 12 + 10-11 = **22-23 categories**.

**Best when**: The Portfolio Visitor's "signal maximal depth/breadth" goal is weighted above the "uncluttered first impression" goal, and the Curator is willing to accept several small, single-purpose categories in exchange for laser-focused drill sessions.

**Pros**:
- Maximum topical precision — a Curator drilling "just Bounded Contexts and Ubiquitous Language" the week before a DDD-heavy interview round gets an undiluted session; nothing else in this document's alternatives offers that level of granularity.
- Could read as confident, deep taxonomy craftsmanship to a technically sophisticated Portfolio Visitor who actually explores the filter bar.

**Cons**:
- Directly works against the project's own stated 6-12 month direction of "content maintenance... over major feature work" (`design-context.md`'s Project Documentation Summary) and against personas.md's Portfolio Visitor pain point ("won't invest time in a confusing or overloaded filter UI").
- Highest risk of *new* thin categories at launch — several splits (e.g., "Architecture Visualization & Modeling": UML/BPMN/C4 only) would start around 3-6 entries, worse than today's already-flagged-thin Mentoring (2) — undermining the polished-taxonomy impression before curation even begins.
- Forces the most invasive FilterBar redesign of all three alternatives (Decision Area 3) purely to stay usable, and maximizes the 3-way hand-sync drift risk `codebase-analysis.md` already flags as a concern (11 more literals across 3 unsynced arrays vs. 6 or 2).
- Highest number of ambiguous boundary calls to defend (11 vs. 6 vs. 2) — e.g., is "Event Storming" strategic-DDD or decision-making-process? This alternative multiplies exactly the judgment-call risk already present in Alternative B.

### Trade-Off Comparison — Decision Area 1

| Perspective | Alt A (2 new / 14 total) | Alt B (6 new / 18 total) | Alt C (10-11 new / 22-23 total) |
|---|---|---|---|
| Technical feasibility | Trivial — smallest literal/test diff | Easy — moderate literal/test diff | Easy per-category, but largest cumulative sync surface |
| User impact (Curator drill precision) | Low — mega-categories blur study sessions | Medium-High — matches natural study boundaries | Highest — but only if categories don't feel sparse |
| User impact (Visitor scannability) | High — smallest FilterBar footprint | Medium — needs UX redesign to stay scannable | Low without an aggressive UX redesign |
| Simplicity | High chip-count simplicity, low internal-category simplicity | Balanced | Low — most categories to reason about |
| Risk | Signal-compression risk (mega-categories) | Boundary-judgment risk (moderate) | Thin-category + FilterBar-overload risk (highest) |
| Scalability (future categories) | Most headroom left | Moderate headroom | Least headroom — likely forces UX redesign regardless |

### Recommendation — Decision Area 1

**Alternative B (source-structure-derived, 6 new categories)**, with an explicit fallback rule: if curation reveals that "Architecture Decision-Making & Modeling" and/or "Distributed Systems Fundamentals" land under ~8 entries each after a full curation pass, merge them into a single "Architecture Decision-Making, Modeling & Distributed Systems Theory" category rather than shipping a new thin category — collapsing 6→5 is a append-safe, low-cost adjustment at that point since nothing downstream depends on the exact count yet. This matches the user's already-stated preference for source-derived grouping while giving convergence a concrete decision rule for the one real risk (thinness) Alternative B carries. Confidence: **medium-high** — the source-fidelity rationale is strong and evidence-linked, but final entry counts (and therefore whether the fallback triggers) are unknown until curation.

---

## Decision Area 2: Cross-Source Overlap & Dedup Strategy

Known overlaps identified from source review: **CQRS** (dna-mapa's Wzorce + `microservice-patterns.md`, appearing twice there), **circuit breaker** (dna-mapa's Design-for-Failure + `microservice-patterns.md`'s Reliability), **service discovery** (dna-mapa: 1 concept; `microservice-patterns.md`: 5 named patterns — client-side, server-side, self-registration, 3rd-party registration, service registry), **distributed tracing** (dna-mapa's Komunikacja + `microservice-patterns.md`'s Observability), **Event Sourcing** (dna-mapa's event-publication patterns, implicit + `microservice-patterns.md`, explicit), and **Service Mesh / sidecar** (dna-mapa's dedicated Service Mesh subsection + `microservice-patterns.md`'s `mesh`/`sidecar` deployment patterns).

### Alternative 1: First-Source-Wins

**Description**: Establish a fixed priority order (e.g., `microservice-patterns.md` wins for pattern-name-level concepts since it's already closest to glossary format; dna-mapa wins for theory/context concepts it uniquely covers). Whichever source is authoritative seeds the entry; the other source's material is skimmed for anything additive but doesn't get its own entry.

**Pros**: Simple, fast, deterministic — no case-by-case judgment call across ~8-12+ known overlaps, minimizing curation decision fatigue on an already content-heavy follow-up pass.

**Cons**: Risks silently dropping genuinely valuable nuance from the "losing" source (dna-mapa's pros/cons framing for circuit breaker is richer than `microservice-patterns.md`'s bare pattern name). Doesn't resolve granularity mismatches (service discovery: 1 concept vs. 5 patterns) — a flat priority rule has nothing to say when the two sources aren't describing the same *shape* of thing.

**Best when**: Curation time is the binding constraint and "good enough, ship it" beats "best possible definition."

### Alternative 2: Merge into Richest Definition

**Description**: For each overlapping concept, synthesize one entry combining the best material from every source that mentions it, with an explicit granularity-resolution sub-rule: when sources disagree on granularity (service discovery), default to the more granular source's decomposition (5 separate entries), folding the coarser source's context into each as supporting material — not as one giant merged entry.

**Pros**: Highest-quality resulting entries, most consistent with the app's existing curation philosophy of "written in the curator's own words, synthesized understanding" (not transcription) per `design-context.md`'s Vision summary. Produces genuine single-source-of-truth entries — critical for Learn Mode's weighted drill algorithm, which has no concept of "these two cards are the same term" and would otherwise double-weight a duplicated concept.

**Cons**: Highest per-concept curation cost — every one of the ~8-12 known overlaps (likely more surface during actual curation) requires reading both treatments and actively synthesizing rather than picking one. Requires a real judgment call on granularity for each overlap.

**Best when**: Entry quality and Learn Mode drill integrity matter more than curation-pass speed — which fits this app's stated portfolio-piece + personal-study dual purpose (`design-context.md`'s Vision summary).

### Alternative 3: Keep Separate with Cross-References

**Description**: Don't dedup. If a concept appears in two categories' contexts (e.g., CQRS as a domain-modeling pattern vs. CQRS as a data-consistency pattern), allow two distinct entries, each covering the facet relevant to its category, with a "see also" note in each `description`.

**Pros**: Zero content loss, preserves each source's own framing intact, lets a single concept be drilled from two genuinely different study angles matching how the Curator actually uses the two source documents.

**Cons**: Directly produces the outcome `codebase-analysis.md`'s own Open Questions explicitly warn against ("curating them as separate entries per source file would create near-duplicate glossary entries"). LearnMode's weighted algorithm has no cross-reference awareness — two "circuit breaker" cards get independently weighted and can both surface in one session, polluting spaced-repetition quality. Browse search for "circuit breaker" returns 2 cards with no visual indication they're related (no UI affordance exists for this — the cross-reference lives only in prose `description` text, easy to miss). Risks reading as sloppiness to the Portfolio Visitor rather than intentional design.

**Best when**: Never recommended as the default — only defensible for a concept whose two facets are genuinely distinct enough that Alternative 2's merge would produce an unreadably long single entry (should be the rare exception, not the rule).

### Known Overlaps — Proposed Dedup Table (illustrative, under Alternative 2)

| Concept | Sources | Granularity | Proposed resolution |
|---|---|---|---|
| CQRS | dna-mapa (Wzorce), microservice-patterns.md (×2, App patterns) | Same | 1 entry → Microservices – Application Patterns |
| Circuit Breaker | dna-mapa (Design for Failure), microservice-patterns.md (App Infra > Reliability) | Same | 1 entry → Microservices – Communication & Reliability |
| Service Discovery | dna-mapa (1 concept, infra- vs. app-side), microservice-patterns.md (5 named patterns) | Mismatched | Follow the finer decomposition (up to 5 entries); dna-mapa's infra-vs-app framing folded in as shared context |
| Distributed Tracing | dna-mapa (Komunikacja), microservice-patterns.md (App Infra > Observability) | Same | 1 entry → Microservices – Communication & Reliability |
| Event Sourcing | dna-mapa (Wzorce > event publication, implicit), microservice-patterns.md (explicit) | Same | 1 entry → Microservices – Application Patterns |
| Service Mesh / Sidecar | dna-mapa (dedicated subsection, Infrastruktury), microservice-patterns.md (`mesh`, `sidecar`, Infrastructure patterns) | Same concept, 2 angles | 1-2 entries (concept + deployment mechanism) → enrich Cloud Engineering, cross-check against Microservices – Discovery & Deployment |

### Recommendation — Decision Area 2

**Alternative 2 (merge into richest definition)** as the standing rule, with Alternative 1's determinism as an explicit, named fallback for genuinely trivial overlaps where the second source adds no non-redundant content (curator's judgment call, not a blanket policy). Reject Alternative 3 outright — it directly contradicts an already-identified risk in this task's own analysis and degrades Learn Mode quality. Confidence: **high** — this is the one decision area where the evidence (Learn Mode's non-dedup-aware weighting, the rubric's synthesis philosophy) points clearly in one direction; the only real cost is curator time, which is a scope/scheduling question for Decision Area 4, not a reason to pick a worse dedup strategy.

---

## Decision Area 3: FilterBar Chip/Overflow UX Redesign

Current mechanism (`src/components/FilterBar.ts`): `VISIBLE_CATEGORY_CHIP_COUNT = 5` (line 31), a `showAllCategories` boolean that only ever flips `false → true` (line 63, set at line 120, never reset), and a generic `renderChips()` loop (lines 100-125) with no per-category branching. Whatever alternative is chosen must remain usable at 14 (Alt A), 18 (Alt B), or 22-23 (Alt C) categories depending on Decision Area 1's outcome.

### Alt UX-1: Raise the Visible-Chip Count

**Description**: Bump `VISIBLE_CATEGORY_CHIP_COUNT` (e.g., 5→8-10), keeping today's exact one-way overflow mechanism otherwise unchanged.

**Implementation cost**: Trivial — one constant change, no new logic; only `BrowseGrid.test.ts`'s positional assertions need updating.

**Persona impact**: Curator gets a few more categories without a click, but at Alt C's 22-23 total, even a count of 10 still leaves 12-13 in overflow — doesn't solve the "no re-collapse" friction at all. Portfolio Visitor sees a slightly longer default chip row, still bounded.

**Pros/Cons**: Cheapest possible change, ships immediately — but doesn't actually redesign anything; punts the real problem to a bigger constant and is insufficient alone at Alt C's category count.

### Alt UX-2: Symmetric Expand/Collapse ("Show Less")

**Description**: Make the existing `showAllCategories` boolean genuinely bidirectional — add a "Show less" control (or make the same chip toggle) that flips it back to `false` and re-renders the collapsed 5-visible view.

**Implementation cost**: Small — the state already exists (line 63); this adds a second click target and one branch, roughly 10-15 lines, plus one new behavior test ("clicking collapse re-hides overflow chips").

**Persona impact**: Directly fixes the specific pain point `codebase-analysis.md` names ("no way to shrink back"). Curator can return to a clean, short bar between sessions. Portfolio Visitor's chip row can return to compact/scannable state after an accidental expand.

**Pros/Cons**: Cheapest fix that resolves a *real, already-flagged* problem rather than just raising a threshold; preserves the existing flat, fully data-driven rendering model exactly (no new grouping metadata needed). Doesn't reduce the number of chips visible *while* expanded — at 18-23 categories, the expanded view is still a wall of chips; only helps return to the compact state, not scan the expanded one. Composes naturally with Alt UX-1 (raise the baseline a bit *and* add collapse).

### Alt UX-3: Two-Tier Grouped Disclosure (Theme Clusters)

**Description**: Presentation-layer-only clustering (the `Category` type/data model stays flat, satisfying the hard constraint) — e.g. a "Microservices ▾" cluster chip expands to reveal its 3 sub-category chips, alongside standalone chips for ungrouped categories (Java, Testing, etc.).

**Implementation cost**: Medium-high — requires a new hand-maintained `Category → theme` grouping map (a **4th** hand-synced taxonomy artifact, layered on the 3 `codebase-analysis.md` already flags as an unenforced drift risk), plus per-cluster expand/collapse state (not just one global boolean) and several new tests. Realistically 40-80 new lines plus test coverage.

**Persona impact**: Best long-term scalability for the Curator — clusters map onto real study groupings ("give me all Microservices content" in one click) and keep the *default* view compact (~8-9 top-level items) regardless of total category count. Portfolio Visitor sees the most polished pattern if well-executed, but if the second tier isn't discovered during a few-second skim, it understates true content breadth.

**Pros/Cons**: The only alternative that scales gracefully to Alt C's 22-23 categories without either view (collapsed or expanded) becoming unwieldy. But it's the highest-cost, highest-new-risk option — a new drift-prone artifact, a bigger state model, and arguably reintroduces hierarchy at the UI layer that the "taxonomy stays flat" constraint's underlying rationale (avoid nested-taxonomy complexity) was trying to sidestep in spirit, even though it technically doesn't touch the `Category` type. Larger UI investment than this project's stated "content maintenance over major feature work" direction plausibly calls for (`design-context.md`).

### Alt UX-4: Pinned Chips + Dropdown/Multi-Select for the Rest

**Description**: Keep ~5 "pinned" quick-access chips, replace the "+N more" chip with a dropdown/checkbox panel listing all remaining categories. Selection logic is identical to today's `toggleCategory` (lines 127-136) — only the rendering/interaction shell for the non-pinned tier changes.

**Implementation cost**: Medium — new DOM (panel + open/close + outside-click handling), but reuses the existing state-management logic entirely; comparable LOC to Alt UX-3 but conceptually simpler (no grouping metadata needed at all).

**Persona impact**: Visual footprint stays **constant regardless of category count** (5 pinned + 1 trigger, whether 14 or 23 total) — most robust against the "must stay usable at whatever count results" success criterion. Familiar multi-select pattern, reasonable keyboard navigation for the power-user Curator. Portfolio Visitor sees the safest, most uncluttered default view of any alternative.

**Pros/Cons**: Best worst-case scalability of any alternative below Alt UX-3's cost. Loses the always-visible live count (`Category (N)`) for anything in the dropdown until opened — a real loss for the Curator's "which categories are worth drilling" at-a-glance scan. Bigger visual/interaction-pattern departure from the current all-chips design language, needs actual visual design work before shipping, not just logic.

### Alt UX-5: Search-Within-Filter (Category Type-Ahead)

**Description**: A small "Filter categories…" text input that live-filters the chip set by substring match, independent of the main content search box.

**Implementation cost**: Small-medium — one new input + one local state var + a filter predicate before the visible/overflow slice; reuses the existing debounce pattern (lines 75-86) as a template.

**Persona impact**: Strongly asymmetric — excellent for the Curator (who already knows the app intimately, per personas.md's discovery-path insight, and can type "micro" to jump straight to the 3 microservices categories), close to irrelevant for the Portfolio Visitor (a stranger skimming for seconds won't type into a filter box).

**Pros/Cons**: Cheap, purely additive, zero regression risk to default behavior. Doesn't address the "scan everything at a glance" need at all — best positioned as a complement to another alternative (e.g., paired with UX-2 or UX-4), not a standalone fix.

### Trade-Off Comparison — Decision Area 3

| Perspective | UX-1 (raise count) | UX-2 (collapse) | UX-3 (clusters) | UX-4 (dropdown) | UX-5 (search) |
|---|---|---|---|---|---|
| Technical feasibility | Trivial | Small | Medium-high (new artifact) | Medium | Small-medium |
| User impact — Curator | Low-medium | Medium-high (fixes named pain point) | Highest at scale | Medium-high | High (power-user only) |
| User impact — Visitor | Medium | Medium-high | Medium (if discovered) | Highest (constant footprint) | Low |
| Simplicity | Highest | High | Lowest (new grouping map) | Medium | High |
| Risk | Low, but insufficient alone at high counts | Low | Highest (4th drift-prone artifact, new state model) | Medium (needs visual design) | Low |
| Scalability (to 22-23 categories) | Poor | Poor alone | Best | Good | N/A (complement only) |

### Recommendation — Decision Area 3

Ship **Alt UX-2 (symmetric collapse)** as the minimum fix regardless of which Decision Area 1 alternative wins — it is cheap, resolves a pain point already named in this task's own analysis, and carries no new architectural risk. Pair it with a modest **Alt UX-1** bump (5→7-8) since the two are non-conflicting and jointly cheap. **If** Decision Area 1 converges on Alternative C (22-23 categories), upgrade to **Alt UX-4 (pinned chips + dropdown)** — it's the only option below Alt UX-3's cost that genuinely stays usable at that count, and it best protects the Portfolio Visitor's uncluttered-first-impression goal. Do **not** build Alt UX-3 (clusters) — its cost and new-drift-risk are disproportionate to this project's stated direction and to Decision Area 1's most likely outcome (18 categories, not 22-23). Treat **Alt UX-5 (search)** as an optional, cheap, Curator-only add-on — worth doing if time allows, not required to meet the "must remain usable" success criterion. Confidence: **medium** — conditional on Decision Area 1's outcome, and the UX-4 visual design hasn't been mocked up yet.

---

## Decision Area 4: Curation Plan Structure

### Alt Seq-1: One Category at a Time, End-to-End

**Description**: Pick a single new category, fully curate all its entries (EN description → PL translation → dedup check → validate) before moving to the next.

**Pros**: Each category reaches shippable state incrementally — matches this project's demonstrated pattern of shipping in phases (`design-context.md`: 14 phases already shipped). Early categories calibrate the curator's own pacing and catch rubric mistakes before they repeat 90+ times. Lets the Curator prioritize whichever category they need soonest for actual interview prep.

**Cons**: Cross-source dedup (Decision Area 2) is harder to execute well category-by-category rather than with full visibility of all overlapping concepts at once — risks locking in a definition for one category before the same concept's treatment in another source/category has been reviewed.

### Alt Seq-2: All Taxonomy/Dedup Decisions First, Then Bulk-Curate

**Description**: Finish 100% of the design-phase paperwork (final category list, full concept→category mapping, all dedup decisions resolved) before writing a single entry, then curate in one or a few large batches.

**Pros**: Cleanest separation of design vs. content work, matching this task's own scope boundary almost exactly. Dedup decisions get made with full visibility of all ~90-110 concepts at once — best fit for Decision Area 2's recommended merge-into-richest strategy.

**Cons**: No incremental shippable checkpoint until the full batch is done — directly risks the exact fatigue/stall pattern personas.md names as the Curator's own stated pain point ("temptation to curate everything at once instead of shipping incrementally").

### Alt Seq-3: Batch by Source File

**Description**: Curate `microservice-patterns.md` fully first (closest to shippable — already tagged, terse, definition-ready), then `system-design terms.md` (smallest, mostly enrichment), then `dna-mapa.md` last (largest, Polish, highest translation-discipline risk).

**Pros**: Sequences from lowest-risk/highest-clarity source to hardest, building curator confidence before the 585-line Polish mind-map. Cleanly isolates the Polish-source translation discipline (constraint 5) to one bounded final phase.

**Cons**: Defers dna-mapa's contribution to every overlapping concept (CQRS, circuit breaker, service discovery, distributed tracing, Event Sourcing — all shared with `microservice-patterns.md`) to the very end, risking a "locked in from one source, retrofit later" pattern that undermines Decision Area 2's merge strategy. Categories touched by both sources look prematurely "done" after the English-source pass, before dna-mapa's material has actually landed.

### Recommendation — Decision Area 4

**Hybrid**: borrow Alt Seq-2's rigor for exactly the parts that need full cross-source visibility — this document's category mapping plus the dedup table above, finalized at convergence — then curate content in **Alt Seq-1's** category-at-a-time cadence (not Alt Seq-3's source-file cadence, which risks the dedup-retrofit problem). Sequence categories by the Curator's actual near-term interview-prep priority, giving natural incremental shippable checkpoints while preserving dedup quality. For the Polish-source discipline specifically: document it as a **standing addition to `content-pipeline/rubric.md`** (a new "Curating from a Polish source" subsection: draft English `description` first, synthesized from the Polish notes — not translated — then independently write `descriptionPl` as a natural translation of the English, not a copy of the Polish source wording) rather than a one-time note in this plan — so it's enforced on every future dna-mapa-sourced entry, not just remembered once. Confidence: **high** on the sequencing logic, **medium** on exact category-priority order (depends on the Curator's actual interview timeline, which this document doesn't have visibility into).

---

## Deferred Ideas (Out of Scope)

- **Collapsing the 3 hand-synced category lists (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`) into one shared source of truth.** `codebase-analysis.md`'s own Opportunities section flags this as worth doing but explicitly "a refactor beyond this task's literal scope." Adding it now would bloat a content/taxonomy task with an unrelated infra refactor — worth raising as a separate follow-up, especially since Decision Area 1's larger alternatives (B, C) increase the drift surface this would fix.
- **Per-category color/icon differentiation** in the FilterBar/badges. `codebase-analysis.md` notes none exists today; it would help scannability at higher category counts (any Decision Area 1 alternative) and pairs naturally with Decision Area 3, but it's a visual-design scope addition not requested by this task's success criteria — flag for a future pass rather than bundling silently here.
- **Running `validate-glossary` in `npm test` / pre-commit**, rather than only at CI deploy time. A real gap (`codebase-analysis.md`'s Concerns), directly relevant to the risk this task increases (more hand-synced category literals), but a testing-infrastructure change outside this task's design-plus-plan scope.
- **Cross-reference UI affordance** (e.g., a "related terms" link on a card) — would only become relevant if Decision Area 2's Alternative 3 (keep-separate-with-cross-references) were chosen; since Alternative 2 is recommended instead, this has no near-term driver, but worth noting as the reason Alternative 3 was rejected rather than merely "more expensive."

---

## Evidence Sources

- `problem-statement.md` — constraints (flat taxonomy, append-only, existing-category enrichment priority, design-not-curation scope, Polish-source discipline, no category ceiling).
- `personas.md` — Curator's drill-in-isolation need and filter-bar-near-capacity pain point; Portfolio Visitor's scannability and industry-recognizable-naming needs.
- `design-context.md` — hand-synced taxonomy risk, FilterBar's 5-visible/overflow mechanism, thin existing categories, project's content-maintenance-over-features direction.
- `codebase-analysis.md` — `src/types/glossary.ts` (Category union, lines 10-22), `src/components/FilterBar.ts` (`ALL_CATEGORIES` lines 13-26, `VISIBLE_CATEGORY_CHIP_COUNT` line 31, `renderChips()` lines 100-125), `content-pipeline/validate-glossary.ts` (`VALID_CATEGORIES`), order-dependent test risk in `BrowseGrid.test.ts`, current per-category entry counts.
- `context/dna-mapa.md` (585 lines, Polish) — full source content reviewed section-by-section for the category-mapping tables above.
- `context/microservice-patterns.md` — the author's own `#Application patterns` / `#Application Infrastructure patterns` / `#Infrastructure patterns` tags, used directly in Alternative B/C's mapping.
- `context/system-design terms.md` — Kafka/Redis/Elasticsearch/Zookeeper/CDN/communication-decision-tree content.
- Direct read of `src/components/FilterBar.ts` and `src/types/glossary.ts` (current code) for the Decision Area 3 implementation-cost estimates.
