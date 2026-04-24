import { describe, expect, it } from 'vitest';
import {
  buildPerspectiveDraftContent,
  normalizeCounterRows,
  normalizeInterpretationInput,
  normalizeObservationInput,
  normalizeUncertaintyRows,
} from '../../apps/web/src/lib/forms/perspective-core-form.js';
import { toCatalogSelections } from '../../apps/web/src/lib/forms/exploration-selection-model.js';

describe('perspective-core-form helpers', () => {
  it('fallanlage und perspektive erzeugen kompatible kernstruktur', () => {
    const observation = normalizeObservationInput({
      observationText: '  Kind A nimmt den Stift.  ',
      cameraState: true,
    });
    const interpretation = normalizeInterpretationInput({
      interpretationText: '  Kind A ist angespannt.  ',
      interpretationEvidence: 'derived',
    });
    const counters = normalizeCounterRows([
      { text: '  Alternative A  ', evidence: 'speculative' },
      { text: '   ', evidence: 'derived' },
    ]);
    const uncertainties = normalizeUncertaintyRows([
      { level: 3, rationale: '  Kontext ist unklar.  ' },
      { level: 2, rationale: '   ' },
    ]);

    const content = buildPerspectiveDraftContent({
      observationText: '  Kind A nimmt den Stift.  ',
      cameraState: true,
      interpretationText: '  Kind A ist angespannt.  ',
      interpretationEvidence: 'derived',
      counterRows: [
        { text: '  Alternative A  ', evidence: 'speculative' },
        { text: '   ', evidence: 'derived' },
      ],
      uncertaintyRows: [
        { level: 3, rationale: '  Kontext ist unklar.  ' },
        { level: 2, rationale: '   ' },
      ],
      selectedNeeds: toCatalogSelections(['need_sec']),
      selectedDeterminants: toCatalogSelections(['det_env']),
    });

    expect(content.observation).toEqual(observation);
    expect(content.interpretation).toEqual(interpretation);
    expect(content.counterInterpretations).toEqual(counters);
    expect(content.uncertainties).toEqual(uncertainties);
  });

  it('leere gegen-deutungen werden einheitlich entfernt', () => {
    const counters = normalizeCounterRows([
      { text: '   ', evidence: 'derived' },
      { text: '', evidence: 'speculative' },
    ]);

    expect(counters).toEqual([]);
  });

  it('leere unsicherheiten werden einheitlich entfernt', () => {
    const uncertainties = normalizeUncertaintyRows([
      { level: 3, rationale: '   ' },
      { level: 4, rationale: '' },
    ]);

    expect(uncertainties).toEqual([]);
  });

  it('exploration selections bleiben reine id-eintraege', () => {
    const content = buildPerspectiveDraftContent({
      observationText: '',
      cameraState: 'null',
      interpretationText: '',
      interpretationEvidence: 'derived',
      counterRows: [],
      uncertaintyRows: [],
      selectedNeeds: toCatalogSelections(['need_sec']),
      selectedDeterminants: toCatalogSelections(['det_group', 'det_env']),
    });

    expect(content.selectedNeeds).toEqual([{ id: 'need_sec' }]);
    expect(content.selectedDeterminants).toEqual([{ id: 'det_group' }, { id: 'det_env' }]);
  });

  it('builder erzeugt keine interpretation automatisch', () => {
    const content = buildPerspectiveDraftContent({
      observationText: 'Nur Beobachtung',
      cameraState: true,
      interpretationText: '   ',
      interpretationEvidence: 'observational',
      counterRows: [],
      uncertaintyRows: [],
    });

    expect(content.observation?.text).toBe('Nur Beobachtung');
    expect(content.interpretation).toBeUndefined();
  });
});
