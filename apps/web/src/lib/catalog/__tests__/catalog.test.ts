import { describe, it, expect } from 'vitest';
import { needs, determinants, clusters, validateCatalogData } from '../catalog-data';
import type { CatalogItem } from '../catalog-data';
import { filterCatalogItems } from '../catalog-utils';

describe('Catalog Data Constraints (Phase 2b)', () => {
  const checkMinimalSchema = (data: readonly CatalogItem[]) => {
    data.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');

      expect(item).toHaveProperty('label');
      expect(typeof item.label).toBe('string');

      expect(item).toHaveProperty('short');
      expect(typeof item.short).toBe('string');

      expect(item).toHaveProperty('description');
      expect(typeof item.description).toBe('string');
    });
  };

  it('needs data conforms to minimal schema', () => {
    checkMinimalSchema(needs);
  });

  it('determinants data conforms to minimal schema', () => {
    checkMinimalSchema(determinants);
  });

  it('clusters data conforms to minimal schema', () => {
    checkMinimalSchema(clusters);
  });
});

describe('Catalog Data Validation Logic', () => {
  it('throws an error if data is not an array', () => {
    expect(() => validateCatalogData({}, 'Test')).toThrow('Catalog import failed: Test data is not an array.');
  });

  it('throws an error if an item is missing required fields or they are empty', () => {
    // Missing id
    expect(() => validateCatalogData([{ label: 'L', short: 'S', description: 'D' }], 'Test'))
      .toThrow("missing valid 'id' string");

    // Empty id after trim
    expect(() => validateCatalogData([{ id: '   ', label: 'L', short: 'S', description: 'D' }], 'Test'))
      .toThrow("missing valid 'id' string");

    // Empty label after trim
    expect(() => validateCatalogData([{ id: '1', label: '   ', short: 'S', description: 'D' }], 'Test'))
      .toThrow("missing valid 'label' string");

    // Empty short after trim
    expect(() => validateCatalogData([{ id: '1', label: 'L', short: '   ', description: 'D' }], 'Test'))
      .toThrow("missing valid 'short' string");

    // Empty description after trim
    expect(() => validateCatalogData([{ id: '1', label: 'L', short: 'S', description: '   ' }], 'Test'))
      .toThrow("missing valid 'description' string");
  });

  it('passes validation for correctly formed items', () => {
    const validData = [{ id: '1', label: 'Label', short: 'Short', description: 'Description' }];
    const result = validateCatalogData(validData, 'Test');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});

describe('Catalog Filtering Logic', () => {
  const mockItems: readonly CatalogItem[] = [
    { id: '1', label: 'Apfelbaum', short: 'Apfel', description: 'Ein roter Apfel' },
    { id: '2', label: 'Birnenbaum', short: 'Birne', description: 'Eine grüne Frucht' },
    { id: '3', label: 'Kirschbaum', short: 'Kirsche', description: 'Kleine rote Früchte' }
  ];

  it('returns all items when query is empty', () => {
    const result = filterCatalogItems(mockItems, '');
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockItems);
  });

  it('returns all items when query contains only whitespace', () => {
    const result = filterCatalogItems(mockItems, '   ');
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockItems);
  });

  it('filters items correctly matching label, short or description', () => {
    const resultLabel = filterCatalogItems(mockItems, 'Apfelbaum');
    expect(resultLabel).toHaveLength(1);
    expect(resultLabel[0].id).toBe('1');

    const resultShort = filterCatalogItems(mockItems, 'Birne');
    expect(resultShort).toHaveLength(1);
    expect(resultShort[0].id).toBe('2');

    const resultDesc = filterCatalogItems(mockItems, 'Früchte');
    expect(resultDesc).toHaveLength(1);
    expect(resultDesc[0].id).toBe('3');
  });

  it('handles case-insensitive and trimmed queries correctly', () => {
    const result = filterCatalogItems(mockItems, '   kIrScHe  ');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('returns empty array when no items match', () => {
    const result = filterCatalogItems(mockItems, 'Banane');
    expect(result).toHaveLength(0);
  });

  it('preserves the original item order', () => {
    const result = filterCatalogItems(mockItems, 'baum');
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[2].id).toBe('3');
  });

  it('does not mutate the passed items array', () => {
    const originalLength = mockItems.length;
    filterCatalogItems(mockItems, 'Apfel');
    expect(mockItems).toHaveLength(originalLength);
    // ensure immutability with strict equality checking on unmodified original object graph
    expect(mockItems[0].label).toBe('Apfelbaum');
  });
});
