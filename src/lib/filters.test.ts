import { describe, it, expect } from 'vitest';
import { applyFilters } from './filters';
import type { BrowseFilterState } from './filters';
import type { Glossary } from '../types/glossary';

const fixture: Glossary = [
  {
    id: 'java-generics',
    term: 'Generics',
    description: 'Type parameters that allow classes and methods to operate on typed objects.',
    translationPl: 'Generyki',
    descriptionPl: 'Parametry typu pozwalające klasom i metodom operować na typowanych obiektach.',
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
  {
    id: 'devops-ci-cd',
    term: 'CI/CD Pipeline',
    description: 'Automated build, test, and deployment workflow.',
    translationPl: 'Potok CI/CD',
    descriptionPl: 'Zautomatyzowany proces budowania, testowania i wdrażania.',
    category: 'DevOps',
    level: 'Regular',
  },
  {
    id: 'devops-containers',
    term: 'Containers',
    description: 'Lightweight, isolated units for packaging and running applications.',
    translationPl: 'Kontenery',
    descriptionPl: 'Lekkie, izolowane jednostki do pakowania i uruchamiania aplikacji.',
    category: 'DevOps',
    level: 'Junior',
  },
];

function baseState(overrides: Partial<BrowseFilterState> = {}): BrowseFilterState {
  return {
    searchQuery: '',
    selectedCategories: [],
    selectedLevel: 'All',
    ...overrides,
  };
}

describe('applyFilters', () => {
  it('category filter alone narrows correctly', () => {
    const result = applyFilters(fixture, baseState({ selectedCategories: ['DevOps'] }));
    expect(result.map((e) => e.id)).toEqual(['devops-ci-cd', 'devops-containers']);
  });

  it('level filter alone narrows correctly', () => {
    const result = applyFilters(fixture, baseState({ selectedLevel: 'Regular' }));
    expect(result.map((e) => e.id)).toEqual(['java-generics', 'devops-ci-cd']);
  });

  it('search matches term, description, translationPl, and descriptionPl (all 4 fields)', () => {
    const byTerm = applyFilters(fixture, baseState({ searchQuery: 'Generics' }));
    expect(byTerm.map((e) => e.id)).toEqual(['java-generics']);

    const byDescription = applyFilters(fixture, baseState({ searchQuery: 'heap' }));
    expect(byDescription.map((e) => e.id)).toEqual(['java-jvm-memory-model']);

    const byTranslationPl = applyFilters(fixture, baseState({ searchQuery: 'Kontenery' }));
    expect(byTranslationPl.map((e) => e.id)).toEqual(['devops-containers']);

    const byDescriptionPl = applyFilters(fixture, baseState({ searchQuery: 'wdrażania' }));
    expect(byDescriptionPl.map((e) => e.id)).toEqual(['devops-ci-cd']);
  });

  it('category + level + search combine with AND semantics', () => {
    const result = applyFilters(
      fixture,
      baseState({
        selectedCategories: ['DevOps'],
        selectedLevel: 'Regular',
        searchQuery: 'pipeline',
      })
    );
    expect(result.map((e) => e.id)).toEqual(['devops-ci-cd']);

    const noMatch = applyFilters(
      fixture,
      baseState({
        selectedCategories: ['DevOps'],
        selectedLevel: 'Junior',
        searchQuery: 'pipeline',
      })
    );
    expect(noMatch).toEqual([]);
  });
});
