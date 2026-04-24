import type { CatalogSelection } from '$domain/types.js';

export type ExplorationPanelMode = 'inline' | 'drawer' | 'modal';

export interface ExplorationSelectionState {
  selectedNeedIds: string[];
  selectedDeterminantIds: string[];
  panelMode?: ExplorationPanelMode;
}

export function toggleSelectionId(selectedIds: readonly string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((currentId) => currentId !== id)
    : [...selectedIds, id];
}

export function toCatalogSelections(selectedIds: readonly string[]): CatalogSelection[] | undefined {
  if (selectedIds.length === 0) {
    return undefined;
  }

  return selectedIds.map((id) => ({ id }));
}

export function fromCatalogSelections(selections?: readonly CatalogSelection[]): string[] {
  return (selections ?? []).map((selection) => selection.id);
}
