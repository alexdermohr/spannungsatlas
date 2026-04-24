import type { CatalogItem } from './catalog-data.js';

export type ClusterFocusItemType = 'need' | 'determinant';
type ClusterFocusMappingShape = Record<string, {
  needs: readonly string[];
  determinants: readonly string[];
}>;

/**
 * Phase-2b UI focus mapping for the exploration selection screen.
 *
 * # Architekturentscheidung: UI-lokale Heuristik
 *
 * Diese Tabelle ist bewusst UI-lokal. Die kanonischen Katalogdaten
 * (`data/catalog/needs.json`, `data/catalog/determinants.json`) enthalten
 * kein `clusterId`-Feld — das Phase-2b-Minimal-Schema (`catalog-data.ts`)
 * erzwingt explizit `{id, label, short, description}` und weist weitere
 * Felder mit einem Fehler zurück. Eine programmatische Ableitung aus den
 * JSON-Daten ist daher ohne Schema-Änderung nicht möglich.
 *
 * # Begründung der konkreten Zuordnungen
 *
 * Die Zuordnungen sind **aus den Cluster-Beschreibungen in `data/catalog/clusters.json`
 * abgeleitet** — die Beschreibungstexte nennen die zugehörigen Konzepte direkt:
 *
 * - `cluster_basic` ("Basisversorgung und Struktur"):
 *   Beschreibung: „grundlegenden physiologischen Bedürfnissen und den sie rahmenden
 *   Raum- und Zeitstrukturen"
 *   → Needs: `need_phys` (Physiologisch), `need_sec` (Sicherheit)
 *   → Determinants: `det_env` (Räumlich-materiell), `det_time` (Zeitstrukturen)
 *
 * - `cluster_social` ("Soziales Gefüge"):
 *   Beschreibung: „Zugehörigkeitsbedürfnissen, Gruppendynamik und personeller Präsenz"
 *   → Needs: `need_soc` (Soziale Zugehörigkeit)
 *   → Determinants: `det_group` (Gruppendynamik), `det_staff` (Personal)
 *
 * - `cluster_develop` ("Entwicklungs- und Wirkungsraum"):
 *   Beschreibung: „Autonomie- und Anerkennungsbedürfnissen im Kontext institutioneller
 *   Grenzen und Vorgaben"
 *   → Needs: `need_aut` (Autonomie), `need_rec` (Anerkennung)
 *   → Determinants: `det_inst` (Institutionelle Vorgaben)
 *
 * # Drift-Risiko
 *
 * Wenn Needs oder Determinants in den JSON-Dateien hinzugefügt oder umbenannt werden,
 * muss diese Tabelle manuell synchronisiert werden. Das Drift-Risiko ist durch Tests
 * in `cluster-focus.test.ts` abgesichert (alle gemappten IDs werden gegen den
 * Live-Katalog geprüft).
 *
 * # Persistenz-Invariante
 *
 * Diese Tabelle steuert ausschließlich die **Sichtbarkeit** im Formular.
 * Sie verändert nicht, welche IDs in `selectedNeedIds` / `selectedDeterminantIds`
 * gespeichert werden. Einträge, die im aktuellen Cluster-Fokus nicht sichtbar sind,
 * bleiben selektiert und persistent.
 */
export const CLUSTER_FOCUS_ITEMS = {
  cluster_basic: {
    needs: ['need_phys', 'need_sec'],
    determinants: ['det_env', 'det_time']
  },
  cluster_social: {
    needs: ['need_soc'],
    determinants: ['det_group', 'det_staff']
  },
  cluster_develop: {
    needs: ['need_aut', 'need_rec'],
    determinants: ['det_inst']
  }
} as const satisfies ClusterFocusMappingShape;

export type ClusterFocusId = keyof typeof CLUSTER_FOCUS_ITEMS;

export function isClusterFocusId(value: string): value is ClusterFocusId {
  return Object.prototype.hasOwnProperty.call(CLUSTER_FOCUS_ITEMS, value);
}

export function getClusterFocusItemIds(clusterId: string): {
  needs: readonly string[];
  determinants: readonly string[];
} {
  if (!isClusterFocusId(clusterId)) {
    return { needs: [], determinants: [] };
  }
  return CLUSTER_FOCUS_ITEMS[clusterId];
}

export function filterItemsByClusterFocus(
  items: readonly CatalogItem[],
  clusterId: string,
  type: ClusterFocusItemType,
): readonly CatalogItem[] {
  if (!isClusterFocusId(clusterId)) return items;

  const allowedIds: ReadonlySet<string> = new Set(type === 'need'
    ? CLUSTER_FOCUS_ITEMS[clusterId].needs
    : CLUSTER_FOCUS_ITEMS[clusterId].determinants);

  return items.filter((item) => allowedIds.has(item.id));
}
