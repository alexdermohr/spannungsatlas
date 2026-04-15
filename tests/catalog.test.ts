import { describe, it, expect } from 'vitest';
import needsData from '../data/catalog/needs.json';
import determinantsData from '../data/catalog/determinants.json';
import clustersData from '../data/catalog/clusters.json';

describe('Catalog Data Constraints (Phase 2b)', () => {
  it('needs data conforms to minimal schema without implicit relations', () => {
    expect(Array.isArray(needsData)).toBe(true);
    expect(needsData.length).toBeGreaterThan(0);

    needsData.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');

      expect(item).toHaveProperty('label');
      expect(typeof item.label).toBe('string');

      expect(item).toHaveProperty('short');
      expect(typeof item.short).toBe('string');

      expect(item).toHaveProperty('description');
      expect(typeof item.description).toBe('string');

      // Explicitly check for absence of relational data
      expect(item).not.toHaveProperty('cases');
      expect(item).not.toHaveProperty('clusterId');
      expect(item).not.toHaveProperty('weight');
    });
  });

  it('determinants data conforms to minimal schema without implicit relations', () => {
    expect(Array.isArray(determinantsData)).toBe(true);
    expect(determinantsData.length).toBeGreaterThan(0);

    determinantsData.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');

      expect(item).toHaveProperty('label');
      expect(typeof item.label).toBe('string');

      expect(item).toHaveProperty('short');
      expect(typeof item.short).toBe('string');

      expect(item).toHaveProperty('description');
      expect(typeof item.description).toBe('string');

      // Explicitly check for absence of relational data
      expect(item).not.toHaveProperty('cases');
      expect(item).not.toHaveProperty('clusterId');
      expect(item).not.toHaveProperty('weight');
    });
  });

  it('clusters data conforms to minimal schema without implicit relations', () => {
    expect(Array.isArray(clustersData)).toBe(true);
    expect(clustersData.length).toBeGreaterThan(0);

    clustersData.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');

      expect(item).toHaveProperty('label');
      expect(typeof item.label).toBe('string');

      expect(item).toHaveProperty('short');
      expect(typeof item.short).toBe('string');

      expect(item).toHaveProperty('description');
      expect(typeof item.description).toBe('string');

      // Explicitly check for absence of relational data
      expect(item).not.toHaveProperty('needs');
      expect(item).not.toHaveProperty('determinants');
    });
  });
});
