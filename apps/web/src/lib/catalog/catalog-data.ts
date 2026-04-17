// TODO: Tech Debt - These deep relative imports bypass module resolution boundaries.
// data/catalog ist aktuell eine globale Quelle. Zukünftig über API oder Alias kapseln.
import needsRaw from '../../../../../data/catalog/needs.json';
import determinantsRaw from '../../../../../data/catalog/determinants.json';
import clustersRaw from '../../../../../data/catalog/clusters.json';

/**
 * Minimaler Pflicht-Contract für Anzeige und Filter in Phase 2b.
 * Spätere Erweiterungen sind nicht verboten, aber hier nicht Gegenstand.
 */
export interface CatalogItem {
  id: string;
  label: string;
  short: string;
  description: string;
}

function validateCatalogData(data: unknown, context: string): CatalogItem[] {
  if (!Array.isArray(data)) {
    throw new Error(`Catalog import failed: ${context} data is not an array.`);
  }

  return data.map((item, index) => {
    if (!item || typeof item !== 'object') {
       throw new Error(`Catalog import failed: ${context} item at index ${index} is not an object.`);
    }
    if (typeof item.id !== 'string' || item.id.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'id' string.`);
    }
    if (typeof item.label !== 'string' || item.label.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'label' string.`);
    }
    if (typeof item.short !== 'string' || item.short.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'short' string.`);
    }
    if (typeof item.description !== 'string' || item.description.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'description' string.`);
    }

    return {
      id: item.id,
      label: item.label,
      short: item.short,
      description: item.description
    };
  });
}

export const needs: readonly CatalogItem[] = validateCatalogData(needsRaw, 'Needs');
export const determinants: readonly CatalogItem[] = validateCatalogData(determinantsRaw, 'Determinants');
export const clusters: readonly CatalogItem[] = validateCatalogData(clustersRaw, 'Clusters');
