// TODO: Tech Debt - These deep relative imports bypass module resolution boundaries.
// data/catalog ist aktuell eine globale Quelle. Zukünftig über API oder Alias kapseln.
import needsRaw from '../../../../../data/catalog/needs.json';
import determinantsRaw from '../../../../../data/catalog/determinants.json';
import clustersRaw from '../../../../../data/catalog/clusters.json';

/**
 * Minimaler Pflicht-Contract für Anzeige und Filter in Phase 2b.
 * Phase 2b erzwingt bewusst einen strikt relationalitätsfreien Minimalcontract.
 * Spätere Erweiterungen erfordern eine explizite Contract-Änderung.
 */
export interface CatalogItem {
  id: string;
  label: string;
  short: string;
  description: string;
}

export function validateCatalogData(data: unknown, context: string): CatalogItem[] {
  if (!Array.isArray(data)) {
    throw new Error(`Catalog import failed: ${context} data is not an array.`);
  }

  const allowedKeys = new Set(['id', 'label', 'short', 'description']);

  return data.map((item, index) => {
    if (!item || typeof item !== 'object') {
       throw new Error(`Catalog import failed: ${context} item at index ${index} is not an object.`);
    }

    const itemKeys = Object.keys(item);
    for (const key of itemKeys) {
      if (!allowedKeys.has(key)) {
        throw new Error(`Catalog import failed: ${context} item at index ${index} contains forbidden key '${key}'. Phase 2b catalog requires strict minimal schema.`);
      }
    }

    if (typeof (item as any).id !== 'string' || (item as any).id.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'id' string.`);
    }
    if (typeof (item as any).label !== 'string' || (item as any).label.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'label' string.`);
    }
    if (typeof (item as any).short !== 'string' || (item as any).short.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'short' string.`);
    }
    if (typeof (item as any).description !== 'string' || (item as any).description.trim().length === 0) {
       throw new Error(`Catalog import failed: ${context} item at index ${index} missing valid 'description' string.`);
    }

    return {
      id: (item as any).id,
      label: (item as any).label,
      short: (item as any).short,
      description: (item as any).description
    };
  });
}

export const needs: readonly CatalogItem[] = validateCatalogData(needsRaw, 'Needs');
export const determinants: readonly CatalogItem[] = validateCatalogData(determinantsRaw, 'Determinants');
export const clusters: readonly CatalogItem[] = validateCatalogData(clustersRaw, 'Clusters');
