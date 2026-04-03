import { describe, it, expect } from 'vitest';
import { renderCaseAsMarkdown } from '../case-report.js';
import type { Case, EvidenceType, UncertaintyLevel } from '$domain/types.js';

describe('renderCaseAsMarkdown', () => {
  it('renders a full Case to Markdown correctly', () => {
    const fullCase: Case = {
      id: 'case-1',
      context: 'Ein Testfall im Kontext.',
      participants: [
        { id: 'Alice', role: 'primary' },
        { id: 'Bob', role: 'secondary' }
      ],
      observation: {
        text: 'Ich sah, wie das Kind weinte.',
        isCameraDescribable: true
      },
      currentReflection: {
        reflectedAt: '2023-01-01T12:00:00Z',
        interpretation: {
          text: 'Das Kind war traurig.',
          evidenceType: 'derived' as EvidenceType
        },
        counterInterpretations: [
          {
            text: 'Das Kind war vielleicht wütend.',
            evidenceType: 'speculative' as EvidenceType
          }
        ],
        uncertainties: [
          {
            level: 3 as UncertaintyLevel,
            rationale: 'Ich konnte das Gesicht nicht genau sehen.'
          }
        ],
        tensions: []
      },
      revisions: []
    };

    const md = renderCaseAsMarkdown(fullCase);

    expect(md).toContain('# Fallbericht');
    expect(md).toContain('## Kontext\nEin Testfall im Kontext.');
    expect(md).toContain('## Beteiligte\n- Alice (Primär)\n- Bob (Sekundär)');
    expect(md).toContain('## Beobachtung\nIch sah, wie das Kind weinte.\n\n*Anmerkung: kamerabeschreibbar*');
    expect(md).toContain('## Deutung\nDas Kind war traurig. [Abgeleitet]');
    expect(md).toContain('## Gegen-Deutungen\n- Das Kind war vielleicht wütend. [Spekulativ]');
    expect(md).toContain('## Unsicherheiten\n- Stufe 3/5: Ich konnte das Gesicht nicht genau sehen.');

    // Deterministic order check: sections appear in order
    const idxContext = md.indexOf('## Kontext');
    const idxParticipants = md.indexOf('## Beteiligte');
    const idxObservation = md.indexOf('## Beobachtung');
    const idxInterpretation = md.indexOf('## Deutung');
    const idxCounter = md.indexOf('## Gegen-Deutungen');
    const idxUncertainties = md.indexOf('## Unsicherheiten');

    expect(idxContext).toBeLessThan(idxParticipants);
    expect(idxParticipants).toBeLessThan(idxObservation);
    expect(idxObservation).toBeLessThan(idxInterpretation);
    expect(idxInterpretation).toBeLessThan(idxCounter);
    expect(idxCounter).toBeLessThan(idxUncertainties);
  });

  it('omits missing or empty fields correctly without outputting undefined', () => {
    const minimalCase = {
      id: 'case-2',
      participants: [],
      context: '',
      observation: {
        text: 'Minimal test',
        isCameraDescribable: false
      },
      currentReflection: {
        reflectedAt: '2023-01-01T12:00:00Z',
        interpretation: {
          text: 'Interp',
          evidenceType: 'observational' as EvidenceType
        },
        counterInterpretations: [],
        uncertainties: [],
        tensions: []
      },
      revisions: []
    } as Case;

    const md = renderCaseAsMarkdown(minimalCase);

    expect(md).toContain('# Fallbericht');
    expect(md).toContain('## Beobachtung\nMinimal test');
    expect(md).toContain('## Deutung\nInterp [Beobachtungsnah]');

    expect(md).not.toContain('## Kontext');
    expect(md).not.toContain('## Beteiligte');
    expect(md).not.toContain('## Gegen-Deutungen');
    expect(md).not.toContain('## Unsicherheiten');
    expect(md).not.toContain('undefined');
    expect(md).not.toContain('null');
  });
});
