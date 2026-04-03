import { describe, expect, it } from 'vitest';
import type { Case } from '$domain/types.js';
import { renderCaseAsMarkdown } from '../case-report.js';

function buildCase(overrides?: Partial<Case>): Case {
  return {
    id: 'case-001',
    context: 'Morgenkreis nach dem Wochenende',
    participants: [
      { id: 'Ben', role: 'secondary' },
      { id: 'Anna', role: 'primary' }
    ],
    observation: {
      text: 'Anna schaut auf den Boden und spricht leise.',
      isCameraDescribable: true
    },
    currentReflection: {
      reflectedAt: '2026-04-03T10:00:00Z',
      interpretation: {
        text: 'Anna wirkt im Gruppensetting gehemmt.',
        evidenceType: 'derived'
      },
      counterInterpretations: [
        { text: 'Anna ist übermüdet.', evidenceType: 'speculative' },
        { text: 'Anna hatte kurz vorher Streit.', evidenceType: 'derived' }
      ],
      uncertainties: [
        { level: 4, rationale: 'Kein Wissen über den Morgen zu Hause.' },
        { level: 2, rationale: 'Bisher nur eine Beobachtungseinheit.' }
      ],
      tensions: []
    },
    revisions: [],
    ...overrides
  };
}

describe('renderCaseAsMarkdown', () => {
  it('renders a complete case to canonical markdown sections', () => {
    const output = renderCaseAsMarkdown(buildCase());

    const lines = output.trim().split('\n');
    expect(lines[0]).toBe('# Fallbericht');
    expect(output).toContain('## Kontext');
    expect(output).toContain('## Beteiligte');
    expect(output).toContain('## Beobachtung');
    expect(output).toContain('## Deutung');
    expect(output).toContain('## Gegen-Deutungen');
    expect(output).toContain('## Unsicherheiten');
    expect(output.indexOf('## Kontext')).toBeLessThan(output.indexOf('## Beteiligte'));
    expect(output.indexOf('## Beteiligte')).toBeLessThan(output.indexOf('## Beobachtung'));
    expect(output.indexOf('## Beobachtung')).toBeLessThan(output.indexOf('## Deutung'));
    expect(output.indexOf('## Deutung')).toBeLessThan(output.indexOf('## Gegen-Deutungen'));
    expect(output.indexOf('## Gegen-Deutungen')).toBeLessThan(output.indexOf('## Unsicherheiten'));
  });

  it('omits empty fields and empty list sections', () => {
    const output = renderCaseAsMarkdown(
      buildCase({
        context: '   ',
        participants: [{ id: '   ', role: undefined }],
        observation: { text: ' ', isCameraDescribable: true },
        currentReflection: {
          ...buildCase().currentReflection,
          interpretation: { text: ' ', evidenceType: 'derived' },
          counterInterpretations: [{ text: '  ', evidenceType: 'derived' }],
          uncertainties: []
        }
      })
    );

    expect(output).toBe('# Fallbericht\n');
  });

  it('uses markdown list format with dash prefix', () => {
    const output = renderCaseAsMarkdown(buildCase());
    const lines = output.split('\n');

    expect(lines).toContain('- Anna (Primär)');
    expect(lines).toContain('- Ben (Sekundär)');
    expect(lines).toContain('- Anna hatte kurz vorher Streit.');
    expect(lines).toContain('- Anna ist übermüdet.');
    expect(lines).toContain('- Stufe 2: Bisher nur eine Beobachtungseinheit.');
    expect(lines).toContain('- Stufe 4: Kein Wissen über den Morgen zu Hause.');
    expect(output.indexOf('- Anna (Primär)')).toBeLessThan(output.indexOf('- Ben (Sekundär)'));
    expect(output.indexOf('- Anna hatte kurz vorher Streit.')).toBeLessThan(output.indexOf('- Anna ist übermüdet.'));
    expect(output.indexOf('- Stufe 2: Bisher nur eine Beobachtungseinheit.')).toBeLessThan(
      output.indexOf('- Stufe 4: Kein Wissen über den Morgen zu Hause.')
    );
  });

  it('is deterministic for same input regardless of source array ordering', () => {
    const first = buildCase();
    const second = buildCase({
      participants: [...first.participants].reverse(),
      currentReflection: {
        ...first.currentReflection,
        counterInterpretations: [...first.currentReflection.counterInterpretations].reverse(),
        uncertainties: [...first.currentReflection.uncertainties].reverse()
      }
    });

    expect(renderCaseAsMarkdown(first)).toBe(renderCaseAsMarkdown(second));
  });

  it('never outputs undefined or null tokens', () => {
    const output = renderCaseAsMarkdown(buildCase());
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('null');
  });

  it('renders participant roles with local readable labels and keeps unknown role raw', () => {
    const output = renderCaseAsMarkdown(
      buildCase({
        participants: [
          { id: 'Alex', role: 'contextual' },
          { id: 'Chris', role: 'staff' }
        ]
      })
    );

    expect(output).toContain('- Alex (Kontextuell)');
    expect(output).toContain('- Chris (staff)');
  });

  it('renders uncertainty without rationale as level-only bullet', () => {
    const output = renderCaseAsMarkdown(
      buildCase({
        currentReflection: {
          ...buildCase().currentReflection,
          uncertainties: [{ level: 3, rationale: '   ' }]
        }
      })
    );

    expect(output).toContain('## Unsicherheiten');
    expect(output).toContain('- Stufe 3');
    expect(output).not.toContain('- Stufe 3:');
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('null');
  });

  it('does not crash when currentReflection is missing and only renders available base sections', () => {
    const caseWithoutReflection = {
      ...buildCase(),
      currentReflection: undefined
    } as unknown as Case;

    expect(() => renderCaseAsMarkdown(caseWithoutReflection)).not.toThrow();
    const output = renderCaseAsMarkdown(caseWithoutReflection);
    expect(output).toContain('# Fallbericht');
    expect(output).toContain('## Kontext');
    expect(output).toContain('## Beobachtung');
    expect(output).not.toContain('## Deutung');
    expect(output).not.toContain('## Gegen-Deutungen');
    expect(output).not.toContain('## Unsicherheiten');
  });
});
