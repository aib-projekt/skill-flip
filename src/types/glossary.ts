/**
 * Core data model for the Skill Flip engineering lexicon.
 *
 * `Category` carries the full 12-value taxonomy from `Engineering Ladder.md`
 * even though this pass's starter dataset (`data/glossary.json`) only
 * populates the `Java` category. Filtering and chip-rendering logic must
 * treat all 12 values as first-class even when some have zero entries.
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
  | 'Software Engineering';

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
