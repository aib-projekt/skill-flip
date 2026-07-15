# Project Vision

## Overview

Skill Flip is a client-only, static single-page web app that provides an interactive bilingual (English/Polish) flashcard lexicon of Java/Backend engineering terms, curated from a 14-category "Engineering Ladder" skills taxonomy.

## Current State

- **Age**: Started 2026-07-01, currently ~3 days of active development
- **Status**: Shipped / actively maintained — production deployment live, all planned phases (through "Phase 14") complete, ongoing small content/bugfix iterations
- **Users**: Personal use (primary) + public visitors via the deployed GitHub Pages demo
- **Tech Stack**: Vite + vanilla TypeScript (strict mode), zero runtime dependencies, Vitest/jsdom for tests, static JSON data + `localStorage` for progress

## Purpose

Skill Flip serves two purposes at once, held as equal priorities:

1. **Personal study tool** — spaced, low-friction review of Java/Backend engineering vocabulary (Regular/Senior level) during short, frequent mobile sessions (e.g. commute/break time).
2. **Portfolio piece** — a polished, interactive, recruiter-facing artifact that demonstrates the author's engineering craft (clean architecture, strong test coverage, documented content pipeline) on first contact, without requiring the visitor to read code or docs first.

The content itself — the curated glossary — is treated as being as valuable as the app that presents it: entries are rewritten in the curator's own words via a documented AI-assisted pipeline (`content-pipeline/`), not transcribed verbatim from the source taxonomy.

## Goals (Next 6-12 Months)

Per current direction, the project stays primarily a **personal study tool**: ongoing low-key content maintenance (adding/refining glossary entries as the underlying Engineering Ladder taxonomy evolves) and small UX/bugfixes as they're noticed in actual use, rather than a major feature push. Portfolio polish (e.g. closing the documentation gaps below) is a secondary, opportunistic goal alongside that.

## Evolution

The project went from a fuzzy idea (a personal flashcard tool) through a full product-design workflow (problem exploration → personas → alternatives → convergence → spec → visual prototyping) to a implemented, tested, and deployed static site in a single continuous push. It started with only the `Java` category populated (~20 entries) and was since expanded to full coverage of all 14 categories (292 entries) — the original 12 from the Engineering Ladder taxonomy plus 2 extended categories (Software Architecture, Microservices & Distributed Systems) added via a dedicated content-curation pass. Small in-production bugs (e.g. an inert category-filter overflow chip) are being found and fixed as real usage surfaces them.
