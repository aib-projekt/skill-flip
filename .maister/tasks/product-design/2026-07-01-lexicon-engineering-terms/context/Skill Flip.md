**Kontekst:** Buduję osobisty leksykon pojęć inżynierskich (Java/Backend, poziom Senior) jako interaktywną appkę HTML, na bazie dokumentu Engineering Ladder (kategorie: Soft Skills, Management, Mentoring, Problem Solving, API Development, Cloud Engineering, Data Storage, DevOps, Java, Software Engineering, Spring/JEE, Testing — każda z podziałem Regular/Senior). Cel podwójny: 1) osobiste narzędzie do nauki/powtórek, 2) publiczne repo na GitHubie jako kolejny przykładowy projekt w portfolio.

**Wymagania funkcjonalne:**
- dane oddzielone od UI: `data/glossary.json` (pola: `term`, `description`, `category`, `level`)
- karty typu flip (hasło z przodu, opis z tyłu)
- język angielski z tłumaczeniem na polski
- filtrowanie po kategorii i poziomie (Regular/Senior)
- wyszukiwarka pełnotekstowa
- tryb nauki: losowa kolejność + oznaczanie "znam/nie znam" + licznik postępu w `localStorage`
- struktura gotowa pod GitHub Pages
- README z opisem projektu i instrukcją dodawania nowych kart

**Stack:** do decyzji na miejscu
wariant A: vanilla HTML/CSS/JS (zero zależności, najprostszy deploy), 
wariant B: Vite. Domyślnie sensowniejszy wydaje się wariant A, chyba że zależy Ci na pokazaniu czegoś więcej z frontendu,
wariant C: sugestia Claude Code.

**Źródło treści:** dokument Engineering_Ladder.md w folderze .maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/context
