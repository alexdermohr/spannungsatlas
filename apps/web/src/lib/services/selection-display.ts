import { needs, determinants } from '$lib/catalog/catalog-data.js';
import type { CatalogSelection } from '$domain/types.js';

/**
 * Build a lookup map of catalog ID → catalog item (label + description).
 * Used to render selection metadata in case detail view.
 */
function buildCatalogMaps() {
  const needMap = new Map(needs.map((n) => [n.id, n]));
  const determinantMap = new Map(determinants.map((d) => [d.id, d]));
  return { needMap, determinantMap };
}

export interface SelectionMetadata {
  type: 'need' | 'determinant';
  source: 'catalog' | 'legacy-unknown';
  id: string;
  label: string;
  short: string;
  description: string;
}

export interface FormattedSelectionsForDisplay {
  needs: readonly SelectionMetadata[];
  determinants: readonly SelectionMetadata[];
  isEmpty: boolean;
}

/**
 * Resolve a list of selection IDs to full catalog metadata.
 * Returns only entries that exist in the current catalog (handles missing/deleted ids gracefully).
 */
export function resolveSelections(
  selections: readonly CatalogSelection[] | undefined,
  catalogType: 'need' | 'determinant'
): readonly SelectionMetadata[] {
  if (!selections || selections.length === 0) return [];

  const { needMap, determinantMap } = buildCatalogMaps();
  const catalog = catalogType === 'need' ? needMap : determinantMap;

  return selections.map((sel) => {
      const item = catalog.get(sel.id);
      return item
        ? {
            type: catalogType,
            source: 'catalog',
            id: item.id,
            label: item.label,
            short: item.short,
            description: item.description
          }
        : {
            type: catalogType,
            source: 'legacy-unknown',
            id: sel.id,
            label: `Unbekannter/veralteter Katalogeintrag: ${sel.id}`,
            short: sel.id,
            description: 'Historischer Eintrag, der im aktuellen Katalog nicht mehr vorhanden ist.'
          };
    });
}

/**
 * Format selections for display: returns grouped entries by catalog type with labels.
 */
export function formatSelectionsForDisplay(
  selectedNeeds: readonly CatalogSelection[] | undefined,
  selectedDeterminants: readonly CatalogSelection[] | undefined
): FormattedSelectionsForDisplay {
  const needs = resolveSelections(selectedNeeds, 'need');
  const determinants = resolveSelections(selectedDeterminants, 'determinant');
  return {
    needs,
    determinants,
    isEmpty: needs.length === 0 && determinants.length === 0
  };
}
