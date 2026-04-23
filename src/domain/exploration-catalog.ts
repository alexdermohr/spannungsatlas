import needsCatalog from '../../data/catalog/needs.json';
import determinantsCatalog from '../../data/catalog/determinants.json';

type CatalogEntry = {
  id?: unknown;
};

function collectKnownIds(entries: unknown, label: string): ReadonlySet<string> {
  if (!Array.isArray(entries)) {
    throw new Error(`${label} catalog must be an array.`);
  }

  const ids = new Set<string>();
  for (const entry of entries as CatalogEntry[]) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || entry.id.trim() === '') {
      throw new Error(`${label} catalog entries must expose a non-empty string id.`);
    }
    ids.add(entry.id);
  }

  return ids;
}

const KNOWN_NEED_IDS = collectKnownIds(needsCatalog, 'Needs');
const KNOWN_DETERMINANT_IDS = collectKnownIds(determinantsCatalog, 'Determinants');

export function isKnownNeedId(id: string): boolean {
  return KNOWN_NEED_IDS.has(id);
}

export function isKnownDeterminantId(id: string): boolean {
  return KNOWN_DETERMINANT_IDS.has(id);
}
