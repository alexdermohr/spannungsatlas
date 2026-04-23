import { describe, expect, it } from 'vitest';
import {
  selectedIdsFromCatalogSelections,
  toCatalogSelections,
  toggleSelectionId,
} from '../../apps/web/src/lib/forms/perspective-exploration-form.js';

describe('perspective exploration form helpers', () => {
  it('toggles a selection on and off', () => {
    expect(toggleSelectionId([], 'need_sec')).toEqual(['need_sec']);
    expect(toggleSelectionId(['need_sec', 'need_aut'], 'need_sec')).toEqual(['need_aut']);
  });

  it('maps persisted catalog selections back to selected ids', () => {
    expect(selectedIdsFromCatalogSelections([{ id: 'need_sec' }, { id: 'need_aut' }])).toEqual([
      'need_sec',
      'need_aut',
    ]);
    expect(selectedIdsFromCatalogSelections(undefined)).toEqual([]);
  });

  it('builds draft payload selections without adding any interpretation field', () => {
    expect(toCatalogSelections(['det_env', 'det_group'])).toEqual([
      { id: 'det_env' },
      { id: 'det_group' },
    ]);
    expect(toCatalogSelections([])).toBeUndefined();
  });
});
