import { describe, expect, it } from 'vitest';
import { determinants, needs } from '../catalog-data.js';
import {
  filterItemsByClusterFocus,
  getClusterFocusItemIds,
  isClusterFocusId,
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
