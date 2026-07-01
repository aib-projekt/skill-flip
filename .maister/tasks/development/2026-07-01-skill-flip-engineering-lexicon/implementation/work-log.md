# Work Log

## 2026-07-01T14:34:16Z - Implementation Started

**Total Steps**: 52
**Task Groups**: 1 (Scaffolding/Git/Data Model), 2 (Card Component), 3 (Filters/Learn Algorithm/Storage), 4 (Browse/Filter/Search UI), 5 (Learn Mode UI), 6 (AppShell & Wiring), 7 (Content Pipeline & Starter Content), 8 (Build/Deploy/Docs), 9 (Test Review & Gap Analysis)

**Execution mode**: parallel wave dispatch (no `--sequential`). Waves: [1] solo; [2,3,7] parallel; [4,5] parallel; [6]; [8]; [9].

**Note**: `.maister/docs/INDEX.md` does not exist in this project (confirmed absent) — no project-specific standards directory to discover from. Conventions instead come from `implementation/spec.md`'s Implementation Guidance section and `implementation-plan.md`'s Standards Compliance section (PascalCase types/components, camelCase lib modules, kebab-case entry IDs, two-tier CSS custom-property naming).

## Standards Reading Log

### Group 1: Scaffolding, Git & Data Model
**From Implementation Plan**:
- camelCase for lib/utility modules — applied to `src/lib/config.ts`
- lowercase-kebab-case for `GlossaryEntry.id` slugs — applied in fixture data
- Two-tier CSS custom-property naming — applied verbatim in `theme.css`

**From INDEX.md**: N/A — no `.maister/docs/INDEX.md` exists, skipped.

**Discovered During Execution**:
- `import.meta.env.BASE_URL`-relative fetch pattern (not hardcoded `/skill-flip/`) — required so `data/glossary.json` resolves correctly under both dev and built base paths; established as the convention for Groups 2-6 whenever a base-path reference is needed.
- Custom `serveRootData` Vite plugin — serves `data/glossary.json` from repo root (not `public/`) in dev and copies it into `dist/data/` on build, keeping one canonical file path for both the browser fetch and Group 7's Node-based validator.
- `@types/node` + `src/vite-env.d.ts` — needed to satisfy `tsc -b --strict` for Node builtins in `vite.config.ts` and `import.meta.env` typing.

## 2026-07-01T14:49:18Z - Group 1 Complete

**Steps**: 1.1 through 1.9 completed
**Standards Applied**: see Standards Reading Log above
**Tests**: 3 passed (glossary.test.ts) — ran in isolation, not full suite
**Files Modified**: package.json, package-lock.json, tsconfig.json, vite.config.ts, .gitignore, index.html, src/main.ts, src/types/glossary.ts, src/types/glossary.test.ts, src/lib/config.ts, src/styles/theme.css, src/vite-env.d.ts, data/glossary.json
**Notes**: `npm run dev` and `npm run build` both verified end-to-end (screenshot + console logs), zero console errors. `npm audit` reports 5 vulnerabilities (3 moderate, 1 high, 1 critical) in transitive devDependencies — typical for the vite/vitest/esbuild toolchain, not addressed (out of scope, `--force` fix risks breaking changes), flagged for awareness. Working tree committed by user request as `158fa78`.

### Loaded Per Group
(Entries added as groups execute)
