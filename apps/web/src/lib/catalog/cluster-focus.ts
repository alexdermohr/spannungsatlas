import type { CatalogItem } from './catalog-data.js';

export type ClusterFocusId = 'cluster_basic' | 'cluster_social' | 'cluster_develop';
export type ClusterFocusItemType = 'need' | 'determinant';

/**
 * Phase-2b UI focus mapping for the selection screen.
 *
 * This mapping is intentionally UI-local: it supports cluster-based navigation
 * in the exploration form and does not alter persisted domain semantics.
 */
const CLUSTER_FOCUS_ITEMS: Record<ClusterFocusId, {
  needs: readonly string[];
  determinants: readonly string[];
}> = {
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
};

export function isClusterFocusId(value: string): value is ClusterFocusId {
  return value === 'cluster_basic' || value === 'cluster_social' || value === 'cluster_develop';
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

  const allowedIds = new Set(type === 'need'
    ? CLUSTER_FOCUS_ITEMS[clusterId].needs
    : CLUSTER_FOCUS_ITEMS[clusterId].determinants);

  return items.filter((item) => allowedIds.has(item.id));
}
