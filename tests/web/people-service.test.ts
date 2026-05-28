import { describe, expect, it } from 'vitest';
import type { Case, ParticipantRole } from '$domain/types.js';
import {
  aggregatePeopleFromCases,
  findCasesForPerson,
  findPersonSummary,
  findRoleForPersonInCase
} from '../../apps/web/src/lib/services/people-service.js';

function buildCase(overrides: Partial<Case> = {}): Case {
  return {
    id: 'case-default',
    context: 'Kontext',
    participants: [{ id: 'Anna', role: 'primary' }],
    observation: { text: 'Beobachtung.', isCameraDescribable: true },
    currentReflection: {
      reflectedAt: '2026-04-01T10:00:00Z',
      interpretation: { text: 'Deutung.', evidenceType: 'derived' },
      counterInterpretations: [{ text: 'Andere Lesart.', evidenceType: 'speculative' }],
      uncertainties: [{ level: 2, rationale: 'Lückenhaft.' }],
      tensions: []
    },
    revisions: [],
    ...overrides
  };
}

describe('aggregatePeopleFromCases', () => {
  it('returns an empty list when there are no cases', () => {
    expect(aggregatePeopleFromCases([])).toEqual([]);
  });

  it('collects each distinct participant id exactly once', () => {
    const cases: Case[] = [
      buildCase({
        id: 'c1',
        participants: [
          { id: 'Anna', role: 'primary' },
          { id: 'Ben', role: 'secondary' }
        ]
      }),
      buildCase({
        id: 'c2',
        participants: [{ id: 'Anna', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-02T10:00:00Z'
        }
      })
    ];

    const summaries = aggregatePeopleFromCases(cases);

    expect(summaries.map((s) => s.id).sort()).toEqual(['Anna', 'Ben']);
  });

  it('counts case appearances per person', () => {
    const cases: Case[] = [
      buildCase({ id: 'c1', participants: [{ id: 'Anna', role: 'primary' }] }),
      buildCase({ id: 'c2', participants: [{ id: 'Anna', role: 'secondary' }] }),
      buildCase({ id: 'c3', participants: [{ id: 'Ben', role: 'primary' }] })
    ];

    const summaries = aggregatePeopleFromCases(cases);
    const anna = summaries.find((s) => s.id === 'Anna');
    const ben = summaries.find((s) => s.id === 'Ben');

    expect(anna?.caseCount).toBe(2);
    expect(ben?.caseCount).toBe(1);
  });

  it('collects the union of roles across cases for the same person', () => {
    const cases: Case[] = [
      buildCase({ id: 'c1', participants: [{ id: 'Anna', role: 'primary' }] }),
      buildCase({ id: 'c2', participants: [{ id: 'Anna', role: 'secondary' }] }),
      buildCase({ id: 'c3', participants: [{ id: 'Anna', role: 'secondary' }] })
    ];

    const anna = aggregatePeopleFromCases(cases).find((s) => s.id === 'Anna');

    const expected: ParticipantRole[] = ['primary', 'secondary'];
    expect(anna?.roles).toEqual(expected);
  });

  it('reports the latest reflectedAt as lastActivity per person', () => {
    const cases: Case[] = [
      buildCase({
        id: 'c1',
        participants: [{ id: 'Anna', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-01T10:00:00Z'
        }
      }),
      buildCase({
        id: 'c2',
        participants: [{ id: 'Anna', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-09T10:00:00Z'
        }
      })
    ];

    const anna = aggregatePeopleFromCases(cases).find((s) => s.id === 'Anna');

    expect(anna?.lastActivity).toBe('2026-04-09T10:00:00Z');
  });

  it('counts a person only once per case even if duplicated in participants', () => {
    const cases: Case[] = [
      buildCase({
        id: 'c1',
        participants: [
          { id: 'Anna', role: 'primary' },
          { id: 'Anna', role: 'secondary' }
        ]
      })
    ];
    const anna = aggregatePeopleFromCases(cases).find((s) => s.id === 'Anna');
    expect(anna?.caseCount).toBe(1);
    const expectedRoles: ParticipantRole[] = ['primary', 'secondary'];
    expect(anna?.roles).toEqual(expectedRoles);
  });

  it('sorts persons by lastActivity descending, then by id', () => {
    const cases: Case[] = [
      buildCase({
        id: 'c1',
        participants: [{ id: 'Anna', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-01T10:00:00Z'
        }
      }),
      buildCase({
        id: 'c2',
        participants: [{ id: 'Ben', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-09T10:00:00Z'
        }
      })
    ];

    const summaries = aggregatePeopleFromCases(cases);

    expect(summaries.map((s) => s.id)).toEqual(['Ben', 'Anna']);
  });
});

describe('findCasesForPerson', () => {
  it('returns only cases the person participates in', () => {
    const cases: Case[] = [
      buildCase({ id: 'c1', participants: [{ id: 'Anna', role: 'primary' }] }),
      buildCase({ id: 'c2', participants: [{ id: 'Ben', role: 'primary' }] }),
      buildCase({
        id: 'c3',
        participants: [
          { id: 'Anna', role: 'secondary' },
          { id: 'Ben', role: 'primary' }
        ]
      })
    ];

    const annaCases = findCasesForPerson('Anna', cases).map((c) => c.id);

    expect(annaCases.sort()).toEqual(['c1', 'c3']);
  });

  it('sorts cases by reflectedAt descending', () => {
    const cases: Case[] = [
      buildCase({
        id: 'older',
        participants: [{ id: 'Anna', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-01T10:00:00Z'
        }
      }),
      buildCase({
        id: 'newer',
        participants: [{ id: 'Anna', role: 'primary' }],
        currentReflection: {
          ...buildCase().currentReflection,
          reflectedAt: '2026-04-09T10:00:00Z'
        }
      })
    ];

    const result = findCasesForPerson('Anna', cases).map((c) => c.id);

    expect(result).toEqual(['newer', 'older']);
  });

  it('returns an empty list when the person is unknown', () => {
    const cases: Case[] = [buildCase({ id: 'c1' })];
    expect(findCasesForPerson('Unbekannt', cases)).toEqual([]);
  });
});

describe('findPersonSummary', () => {
  it('returns the summary entry for the given person', () => {
    const cases: Case[] = [buildCase({ id: 'c1', participants: [{ id: 'Anna', role: 'primary' }] })];
    const summary = findPersonSummary('Anna', cases);
    expect(summary?.id).toBe('Anna');
    expect(summary?.caseCount).toBe(1);
  });

  it('returns null when the person is unknown', () => {
    const cases: Case[] = [buildCase({ id: 'c1' })];
    expect(findPersonSummary('Unbekannt', cases)).toBeNull();
  });
});

describe('findRoleForPersonInCase', () => {
  it('returns the participant role in that specific case', () => {
    const c = buildCase({
      participants: [
        { id: 'Anna', role: 'primary' },
        { id: 'Ben', role: 'secondary' }
      ]
    });
    expect(findRoleForPersonInCase('Anna', c)).toBe('primary');
    expect(findRoleForPersonInCase('Ben', c)).toBe('secondary');
  });

  it('returns undefined when the person is not a participant', () => {
    const c = buildCase({ participants: [{ id: 'Anna', role: 'primary' }] });
    expect(findRoleForPersonInCase('Ben', c)).toBeUndefined();
  });
});
