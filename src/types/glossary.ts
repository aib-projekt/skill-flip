/**
 * Core data model for the Skill Flip engineering lexicon.
 *
 * `Category` carries the full 14-value taxonomy. 12 of the 14 values come
 * from `Engineering Ladder.md`; 2 ('Software Architecture', 'Microservices &
 * Distributed Systems') extend beyond that original source, populated via a
 * dedicated content-curation pass covering software-architecture fundamentals,
 * microservices patterns, and distributed-systems theory.
 */

export type Category =
  | 'Java'
  | 'Spring/JEE'
  | 'Data Storage'
  | 'DevOps'
  | 'Cloud Engineering'
  | 'Testing'
  | 'Soft Skills'
  | 'Management'
  | 'Mentoring'
  | 'Problem Solving'
  | 'API Development'
  | 'Software Engineering'
  | 'Software Architecture'
  | 'Microservices & Distributed Systems';

export type Level = 'Junior' | 'Regular' | 'Senior';

export interface GlossaryEntry {
  /** Stable, lowercase-kebab-case slug, e.g. "java-generics". */
  id: string;
  /** English term (primary). */
  term: string;
  /** English full definition (primary). */
  description: string;
  /** Polish translation of the term. */
  translationPl: string;
  /** Polish translation of the full definition. */
  descriptionPl: string;
  category: Category;
  level: Level;
}

export type Glossary = GlossaryEntry[];
