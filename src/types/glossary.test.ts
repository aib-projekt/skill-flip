import { describe, it, expect } from 'vitest';
import type { GlossaryEntry, Category, Level, Glossary } from './glossary';

describe('glossary data model', () => {
  it('GlossaryEntry shape accepts all required fields', () => {
    const entry: GlossaryEntry = {
      id: 'java-generics',
      term: 'Generics',
      description: 'Type parameters that allow classes and methods to operate on typed objects.',
      translationPl: 'Generyki',
      descriptionPl: 'Parametry typu pozwalające klasom i metodom operować na typowanych obiektach.',
      category: 'Java',
      level: 'Regular',
    };

    expect(entry.id).toBe('java-generics');
    expect(entry.term).toBe('Generics');
    expect(entry.description).toBeTypeOf('string');
    expect(entry.translationPl).toBe('Generyki');
    expect(entry.descriptionPl).toBeTypeOf('string');
    expect(entry.category).toBe('Java');
    expect(entry.level).toBe('Regular');
  });

  it('a fixture array of 3+ entries type-checks against Glossary', () => {
    const fixture: Glossary = [
      {
        id: 'java-generics',
        term: 'Generics',
        description: 'Type parameters for classes and methods.',
        translationPl: 'Generyki',
        descriptionPl: 'Parametry typu dla klas i metod.',
        category: 'Java',
        level: 'Regular',
      },
      {
        id: 'java-streams',
        term: 'Streams API',
        description: 'A sequence of elements supporting functional-style operations.',
        translationPl: 'Streams API',
        descriptionPl: 'Sekwencja elementów wspierająca operacje w stylu funkcyjnym.',
        category: 'Java',
        level: 'Regular',
      },
      {
        id: 'java-jvm-memory-model',
        term: 'JVM Memory Model',
        description: 'How the JVM organizes heap, stack, and metaspace memory.',
        translationPl: 'Model pamięci JVM',
        descriptionPl: 'Sposób w jaki JVM organizuje pamięć sterty, stosu i metaspace.',
        category: 'Java',
        level: 'Senior',
      },
    ];

    expect(fixture).toHaveLength(3);
    expect(fixture.every((e) => typeof e.id === 'string')).toBe(true);
  });

  it('Category enum includes exactly the 12 taxonomy values and Level includes exactly Junior/Regular/Senior', () => {
    const categories: Category[] = [
      'Java',
      'Spring/JEE',
      'Data Storage',
      'DevOps',
      'Cloud Engineering',
      'Testing',
      'Soft Skills',
      'Management',
      'Mentoring',
      'Problem Solving',
      'API Development',
      'Software Engineering',
    ];

    expect(categories).toHaveLength(12);
    expect(new Set(categories).size).toBe(12);

    const levels: Level[] = ['Junior', 'Regular', 'Senior'];
    expect(levels).toHaveLength(3);
    expect(new Set(levels).size).toBe(3);
  });
});
