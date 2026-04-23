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

/**
 * Write-time strict catalog-membership validation.
 *
 * DESIGN DECISION — write-time strict / read-time tolerant:
 *
 * The domain guards in `guards.ts` validate catalog selection structure only
 * (non-empty ids, no duplicates), NOT catalog membership. This allows
 * historically persisted cases to survive catalog evolution without silent
 * data loss: if a catalog entry is later renamed or removed, previously saved
 * perspectives continue to load and display correctly.
 *
 * This function provides the catalog-membership check that MUST be called
 * ONLY at write time — i.e. when new user input is about to be persisted.
 * It must NOT be called during read/load paths.
 *
 * Returns an array of error strings (empty if all ids are known).
 */
export function validateNewPerspectiveCatalogIds(
  selectedNeeds: readonly { id: string }[] | undefined,
  selectedDeterminants: readonly { id: string }[] | undefined,
): readonly string[] {
  const errors: string[] = [];

  for (const sel of selectedNeeds ?? []) {
    if (!isKnownNeedId(sel.id)) {
      errors.push(`selectedNeeds contains unknown need id "${sel.id}".`);
    }
  }

  for (const sel of selectedDeterminants ?? []) {
    if (!isKnownDeterminantId(sel.id)) {
      errors.push(`selectedDeterminants contains unknown determinant id "${sel.id}".`);
    }
  }

  return errors;
}
