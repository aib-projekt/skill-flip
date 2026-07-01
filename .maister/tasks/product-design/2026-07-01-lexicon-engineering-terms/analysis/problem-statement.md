# Problem Statement: Skill Flip — Engineering Lexicon

## TL;DR
No personal, organized tool exists for reviewing the Java/Backend Senior-level vocabulary in the Engineering Ladder taxonomy, and no polished public artifact demonstrates that knowledge (and frontend craft) to recruiters. Building a mobile-first, client-only flashcard app with curated (not transcribed) content, weighted learn-mode resurfacing, and a muted painterly visual identity drawn from the AiB Projekt GitHub avatar. Both the personal-study and portfolio goals are equal priority — neither gets shortchanged.

## Key Decisions
- Content will be curated & rewritten as true glossary terms via an AI-assisted generation pass, then reviewed/edited by the creator — not a verbatim transcription of Engineering Ladder bullets. (rationale: ladder bullets are ability statements, not term+definition pairs; quality matters equally to the portfolio goal)
- Mobile-first, touch-friendly design. (rationale: actual study sessions happen on mobile during downtime)
- Learn mode uses lightweight weighted resurfacing (don't-know cards appear more often), not simple binary in/out filtering, and not full Anki-style scheduling. (rationale: user wants more than a stat counter but explicitly ruled out full spaced-repetition complexity)
- Visual identity derives from the AiB Projekt GitHub org avatar's muted painterly palette (navy/charcoal, steel blue-gray, sage green, pale chartreuse, ice-blue, cream) rather than a generic tech-blue theme. (rationale: explicit user direction, ties the project to existing brand presence)
- Tech stack decision (vanilla JS vs. Vite vs. alternative) deliberately deferred to the alternatives/convergence phase rather than fixed here.

## Open Questions / Risks
- "Lightweight weighted resurfacing" needs a concrete, simple algorithm defined during specification — risk of over-engineering into a full spaced-repetition system if not scoped carefully.
- AI-assisted content generation is a one-time pipeline step outside the shipped app's runtime — needs a clear boundary in the spec between "how content gets authored" and "how the app consumes `glossary.json`".
- Full category coverage (~150 terms across 12 categories) is a larger content-authoring effort than the app-building effort itself; timeline/sequencing isn't fixed yet.

---

## Problem Statement

There's no personal, well-organized tool for reviewing the Java/Backend Senior-level engineering vocabulary defined in the Engineering Ladder taxonomy, and no polished, public artifact demonstrating that knowledge (and frontend craft) to recruiters or visitors. The raw source material (~150 skill bullets across 12 categories: Soft Skills, Management, Mentoring, Problem Solving, API Development, Cloud Engineering, Data Storage, DevOps, Java, Software Engineering, Spring/JEE, Testing) exists in `Engineering Ladder.md` but isn't in a reviewable, flashcard-friendly shape.

**Who it's for**:
- **Primary**: the creator, studying/reviewing Senior-level engineering vocabulary, mostly on mobile during downtime (commute, breaks).
- **Secondary**: technical recruiters or visitors browsing the public GitHub repo or live GitHub Pages demo, evaluating it as a portfolio artifact.

**Motivation**: both goals — personal study utility and public portfolio quality — are equal priority. Neither is being built as an MVP shortcut for the other; the app should be genuinely useful to study from AND genuinely presentable as a project.

## Constraints

1. **Client-only, static site** — no backend/server component. Deployable as-is to GitHub Pages.
2. **Data/UI separation** — content lives in `data/glossary.json` with fields: `term`, `description`, `category`, `level`, plus a Polish-translation field (exact field name TBD in spec).
3. **Content curation, not transcription** — Engineering Ladder bullets are rewritten into proper term+definition pairs via an AI-assisted generation pass, then reviewed/edited by the creator before shipping. This is a one-time content pipeline, not a runtime feature.
4. **Mobile-first, responsive** — touch-friendly interactions (flip, swipe) are a primary design target, not an afterthought; desktop use should also work well.
5. **Visual identity** — palette and mood draw from the AiB Projekt GitHub org avatar: muted painterly tones (navy/charcoal, steel blue-gray, sage green, pale chartreuse, ice-blue, cream), not a generic "tech blue" SaaS look.
6. **Tech stack open** — vanilla HTML/CSS/JS vs. Vite vs. another option is an explicit decision left for the alternatives/convergence phase (Phase 4/5), not fixed here.
7. **No cross-device sync** — learn-mode progress lives in browser `localStorage`; this is an accepted limitation of the client-only approach, not a gap to solve.

## Success Criteria

- **Actually used**: the creator returns to it for real study sessions after the first week, not just at launch.
- **Demo-able**: holds up as a strong first impression when linked from a CV, portfolio site, or LinkedIn post.
- **Recruiter-readable codebase**: repo structure, commit history, and README are clean enough that a technical reviewer skimming the code forms a positive impression.
- **Full content coverage**: all 12 Engineering Ladder categories have quality, curated entries — not a partial demo subset.
- **Learn mode feels smart, not gimmicky**: weighted resurfacing of "don't know" cards is noticeably more helpful than plain random shuffling, without the complexity of a full spaced-repetition scheduler.
