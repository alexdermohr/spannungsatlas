import type { CatalogItem } from './catalog-data';

export function filterCatalogItems(items: CatalogItem[], query: string): CatalogItem[] {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter(item =>
    item.label.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    item.short.toLowerCase().includes(lowerQuery)
  );
}
