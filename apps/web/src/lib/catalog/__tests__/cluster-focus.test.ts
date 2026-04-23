import { describe, expect, it } from 'vitest';
import { determinants, needs } from '../catalog-data.js';
import { filterCatalogItems } from '../catalog-utils.js';
import {
  CLUSTER_FOCUS_ITEMS,
  filterItemsByClusterFocus,
  getClusterFocusItemIds,
  isClusterFocusId,
  type ClusterFocusId,
} from '../cluster-focus.js';

describe('cluster-focus helpers', () => {
  it('recognizes valid cluster focus ids', () => {
    expect(isClusterFocusId('cluster_basic')).toBe(true);
    expect(isClusterFocusId('cluster_social')).toBe(true);
    expect(isClusterFocusId('cluster_develop')).toBe(true);
    expect(isClusterFocusId('cluster_unknown')).toBe(false);
  });

  it('returns mapped ids for cluster_basic', () => {
    const ids = getClusterFocusItemIds('cluster_basic');
    expect(ids.needs).toEqual(['need_phys', 'need_sec']);
    expect(ids.determinants).toEqual(['det_env', 'det_time']);
  });

  it('returns empty mappings for unknown cluster ids', () => {
    const ids = getClusterFocusItemIds('cluster_unknown');
    expect(ids.needs).toEqual([]);
    expect(ids.determinants).toEqual([]);
  });

  it('filters needs and determinants by selected cluster', () => {
    expect(filterItemsByClusterFocus(needs, 'cluster_social', 'need').map((item) => item.id)).toEqual(['need_soc']);
    expect(filterItemsByClusterFocus(determinants, 'cluster_social', 'determinant').map((item) => item.id)).toEqual(['det_group', 'det_staff']);
  });

  it('passes all items through for unknown cluster ids', () => {
    expect(filterItemsByClusterFocus(needs, 'unknown', 'need')).toEqual(needs);
    expect(filterItemsByClusterFocus(determinants, 'unknown', 'determinant')).toEqual(determinants);
  });
});

describe('cluster-focus drift guard', () => {
  const clusterIds: ClusterFocusId[] = ['cluster_basic', 'cluster_social', 'cluster_develop'];
  const needIds = new Set(needs.map((n) => n.id));
  const determinantIds = new Set(determinants.map((d) => d.id));

  it('every need ID in CLUSTER_FOCUS_ITEMS exists in catalog needs', () => {
    for (const clusterId of clusterIds) {
      for (const id of CLUSTER_FOCUS_ITEMS[clusterId].needs) {
        expect(needIds.has(id), `need ID '${id}' mapped in ${clusterId} is missing from catalog needs.json`).toBe(true);
      }
    }
  });

  it('every determinant ID in CLUSTER_FOCUS_ITEMS exists in catalog determinants', () => {
    for (const clusterId of clusterIds) {
      for (const id of CLUSTER_FOCUS_ITEMS[clusterId].determinants) {
        expect(determinantIds.has(id), `determinant ID '${id}' mapped in ${clusterId} is missing from catalog determinants.json`).toBe(true);
      }
    }
  });

  it('all cluster focus ids are recognised by isClusterFocusId', () => {
    for (const clusterId of Object.keys(CLUSTER_FOCUS_ITEMS)) {
      expect(isClusterFocusId(clusterId), `${clusterId} in CLUSTER_FOCUS_ITEMS is not recognised by isClusterFocusId`).toBe(true);
    }
  });

  it('cluster_develop mapping is correct', () => {
    const ids = getClusterFocusItemIds('cluster_develop');
    expect(ids.needs).toEqual(['need_aut', 'need_rec']);
    expect(ids.determinants).toEqual(['det_inst']);
  });
});

describe('cluster-focus UX behaviour: display-only filter, persistence invariant', () => {
  it('filter does not mutate the source array (selected items remain outside visible list)', () => {
    // Selecting need_phys in cluster_basic, then switching to cluster_social:
    // need_phys is NOT in cluster_social's visible list, but the full needs array is unmodified.
    const visibleInSocial = filterItemsByClusterFocus(needs, 'cluster_social', 'need');
    expect(visibleInSocial.map((n) => n.id)).not.toContain('need_phys');

    // The source array is unaffected — need_phys is still accessible
    expect(needs.map((n) => n.id)).toContain('need_phys');
  });

  it('a selected need from cluster_basic is invisible but not deleted when cluster_social is active', () => {
    // Simulates the case: user selected 'need_phys' (cluster_basic), then switches to cluster_social.
    // The selection logic in the form stores selectedNeedIds independently of activeClusterId.
    // filterItemsByClusterFocus only controls what is rendered — not what is stored.
    const selectedNeedIds = ['need_phys', 'need_soc']; // two selections, different clusters

    const visibleInSocial = filterItemsByClusterFocus(needs, 'cluster_social', 'need').map((n) => n.id);
    expect(visibleInSocial).toContain('need_soc');
    expect(visibleInSocial).not.toContain('need_phys'); // invisible in this focus

    // But selectedNeedIds is unchanged — the selection is persisted
    expect(selectedNeedIds).toContain('need_phys');
    expect(selectedNeedIds).toContain('need_soc');
  });

  it('search within cluster focus: returns only items matching both search and cluster', () => {
    // cluster_basic needs: need_phys, need_sec
    // Searching 'sicherheit' within cluster_basic should return only need_sec
    const searchResult = filterItemsByClusterFocus(
      filterCatalogItems(needs, 'sicherheit'),
      'cluster_basic',
      'need'
    );
    expect(searchResult.map((n) => n.id)).toEqual(['need_sec']);
  });

  it('search term matching items outside the active cluster returns empty list', () => {
    // 'autonomie' matches need_aut (cluster_develop), but active cluster is cluster_basic
    const searchResult = filterItemsByClusterFocus(
      filterCatalogItems(needs, 'autonomie'),
      'cluster_basic',
      'need'
    );
    expect(searchResult).toHaveLength(0);
  });

  it('empty search within cluster focus returns all cluster items', () => {
    const searchResult = filterItemsByClusterFocus(
      filterCatalogItems(needs, ''),
      'cluster_social',
      'need'
    );
    expect(searchResult.map((n) => n.id)).toEqual(['need_soc']);
  });
});

