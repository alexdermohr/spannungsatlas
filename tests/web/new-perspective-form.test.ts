import { describe, expect, it } from 'vitest';
import { createEmptyPerspectiveFormState, mapDraftToFormState } from '../../apps/web/src/lib/forms/new-perspective-form.js';

describe('new-perspective-form logic', () => {
  it('resets all fields when no draft is provided', () => {
    // Simulate actor switch: old actor had data, new actor has no draft (null)
    const emptyState = mapDraftToFormState(null);

    expect(emptyState.observationText).toBe('');
    expect(emptyState.isCameraDescribable).toBe(false);
    expect(emptyState.interpretationText).toBe('');
    expect(emptyState.interpretationEvidence).toBe('observational');
    expect(emptyState.counterRows).toEqual([{ text: '', evidence: 'observational' }]);
    expect(emptyState.uncertaintyRows).toEqual([{ level: 2, rationale: '' }]);
    expect(emptyState.draftCreatedAt).toBeNull();
    expect(emptyState.errorMsg).toBe('');
    expect(emptyState.draftId).toBeTruthy(); // UUID generated
  });

  it('maps an existing draft to form state', () => {
    const mockDraft = {
      id: 'd-123',
      createdAt: '2026-04-01T10:00:00Z',
      content: {
        observation: { text: 'obs', isCameraDescribable: true },
        interpretation: { text: 'int', evidenceType: 'derived' },
        counterInterpretations: [{ text: 'c1', evidenceType: 'speculative' }],
        uncertainties: [{ level: 5, rationale: 'unc1' }]
      }
    };

    const state = mapDraftToFormState(mockDraft);

    expect(state.draftId).toBe('d-123');
    expect(state.draftCreatedAt).toBe('2026-04-01T10:00:00Z');
    expect(state.observationText).toBe('obs');
    expect(state.isCameraDescribable).toBe(true);
    expect(state.interpretationText).toBe('int');
    expect(state.interpretationEvidence).toBe('derived');
    expect(state.counterRows).toEqual([{ text: 'c1', evidence: 'speculative' }]);
    expect(state.uncertaintyRows).toEqual([{ level: 5, rationale: 'unc1' }]);
  });
});
