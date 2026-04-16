import type { CatalogItem } from './catalog-data';

export function filterCatalogItems(items: readonly CatalogItem[], query: string): readonly CatalogItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter(item =>
    item.label.toLowerCase().includes(normalized) ||
    item.description.toLowerCase().includes(normalized) ||
    item.short.toLowerCase().includes(normalized)
  );
}
