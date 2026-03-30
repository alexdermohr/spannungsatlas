import { describe, expect, it } from 'vitest';
import {
  ensureTrailingEmptyRow,
  filledParticipants,
  normalizeParticipants,
  refreshFieldErrors,
  shouldShowRemoveParticipant,
  type ParticipantRow
} from '../../apps/web/src/lib/forms/new-case-form.js';

function participant(name: string, role: ParticipantRow['role'] = 'primary'): ParticipantRow {
  return { name, role };
}

describe('new-case form helpers', () => {
  it('adds exactly one empty trailing row when the last participant becomes non-empty', () => {
    expect(ensureTrailingEmptyRow([participant('Anna')])).toEqual([
      participant('Anna'),
      participant('')
    ]);
    expect(ensureTrailingEmptyRow([participant('Anna'), participant('')])).toEqual([
      participant('Anna'),
      participant('')
    ]);
  });

  it('normalizes to filled participants plus exactly one empty trailing row', () => {
    expect(
      normalizeParticipants([
        participant('Anna'),
        participant('   '),
        participant('Ben', 'secondary'),
        participant('')
      ])
    ).toEqual([
      participant('Anna'),
      participant('Ben', 'secondary'),
      participant('')
    ]);
  });

  it('returns trimmed filled participants only', () => {
    expect(
      filledParticipants([
        participant(' Anna '),
        participant(''),
        participant(' Ben', 'staff')
      ])
    ).toEqual([
      participant('Anna'),
      participant('Ben', 'staff')
    ]);
  });

  it('shows the remove button only when more than one participant is filled', () => {
    const single = [participant('Anna'), participant('')];
    const multiple = [participant('Anna'), participant('Ben', 'secondary'), participant('')];

    expect(shouldShowRemoveParticipant(single, single[0]!)).toBe(false);
    expect(shouldShowRemoveParticipant(multiple, multiple[0]!)).toBe(true);
    expect(shouldShowRemoveParticipant(multiple, multiple[1]!)).toBe(true);
    expect(shouldShowRemoveParticipant(multiple, multiple[2]!)).toBe(false);
  });

  it('clears only relevant field errors and _submit while keeping unrelated errors', () => {
    expect(
      refreshFieldErrors(
        {
          context: 'Kontext darf nicht leer sein.',
          interpretationText: 'Beobachtung und Deutung dürfen nicht identisch sein.',
          _submit: 'Submit fehlgeschlagen.'
        },
        {
          interpretationText: 'Beobachtung und Deutung dürfen nicht identisch sein.'
        },
        ['context']
      )
    ).toEqual({
      interpretationText: 'Beobachtung und Deutung dürfen nicht identisch sein.'
    });
  });

  it('recomputes dependent field errors instead of dropping them blindly', () => {
    expect(
      refreshFieldErrors(
        {
          interpretationText: 'Beobachtung und Deutung dürfen nicht identisch sein.'
        },
        {
          interpretationText: 'Deutung darf nicht leer sein.'
        },
        ['interpretationText']
      )
    ).toEqual({
      interpretationText: 'Deutung darf nicht leer sein.'
    });
  });
});
