# Design Context Index

Source: product-design task `.maister/tasks/product-design/2026-07-13-add-new-categories-terms/`

## Screens / Components

| ID | Source Mockup | Description |
|---|---|---|
| `screen:browse-filterbar` | `mockups/browse-filterbar-at-14-categories.html` | Browse view's FilterBar at 14 categories (12 existing + "Software Architecture" + "Microservices & Distributed Systems"). Demonstrates symmetric expand/collapse (7 visible chips ↔ all 14, trailing chip relabels "+7 more"/"Show less"), category badges on sample cards via the existing generic slugifier, and search/level-toggle context around the FilterBar. Interactive (real JS toggle), built with the app's actual theme tokens. Binding input for Section 4 of `implementation/spec.md` (once created) and any FilterBar-touching task group.
