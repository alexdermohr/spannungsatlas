import { describe, expect, it } from 'vitest';
import { formatSelectionsForDisplay, resolveSelections } from '../../apps/web/src/lib/services/selection-display.js';

describe('selection-display', () => {
  it('keeps unknown historical ids visible as legacy markers instead of dropping them', () => {
    const resolved = resolveSelections([{ id: 'need_legacy_removed' }], 'need');

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe('need_legacy_removed');
    expect(resolved[0]?.source).toBe('legacy-unknown');
    expect(resolved[0]?.label).toContain('Unbekannter/veralteter Katalogeintrag');
  });

  it('returns known catalog entries with catalog source metadata', () => {
    const resolved = resolveSelections([{ id: 'need_sec' }], 'need');

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe('need_sec');
    expect(resolved[0]?.source).toBe('catalog');
  });

  it('marks display as non-empty when only legacy entries exist', () => {
    const formatted = formatSelectionsForDisplay(
      [{ id: 'need_legacy_removed' }],
      [{ id: 'det_legacy_removed' }]
    );

    expect(formatted.isEmpty).toBe(false);
    expect(formatted.needs[0]?.source).toBe('legacy-unknown');
    expect(formatted.determinants[0]?.source).toBe('legacy-unknown');
  });
});
