import type { CatalogSelection } from '$domain/types.js';

export function selectedIdsFromCatalogSelections(
  selections?: readonly CatalogSelection[],
): string[] {
  return (selections ?? []).map((selection) => selection.id);
}

export function toggleSelectionId(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((currentId) => currentId !== id)
    : [...selectedIds, id];
}

export function toCatalogSelections(
  selectedIds: string[],
): CatalogSelection[] | undefined {
  if (selectedIds.length === 0) {
    return undefined;
  }

  return selectedIds.map((id) => ({ id }));
}
