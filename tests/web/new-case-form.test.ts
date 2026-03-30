import { describe, expect, it } from 'vitest';
import {
  ensureTrailingEmptyRow,
  filledParticipants,
  normalizeParticipants,
  refreshFieldErrors,
  clearErrorKeysWithPrefix,
  shouldShowRemoveParticipant,
  type ParticipantRow,
  filledCounterRows,
  ensureTrailingEmptyCounterRow,
  normalizeCounterRows,
  shouldShowRemoveCounterRow,
  type CounterRow,
  DEFAULT_COUNTER_EVIDENCE,
  filledUncertaintyRows,
  ensureTrailingEmptyUncertaintyRow,
  normalizeUncertaintyRows,
  shouldShowRemoveUncertaintyRow,
  type UncertaintyRow,
  DEFAULT_UNCERTAINTY_LEVEL
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

function counter(text: string, evidence = DEFAULT_COUNTER_EVIDENCE): CounterRow {
  return { text, evidence };
}

describe('counter-row helpers', () => {
  it('returns only trimmed non-empty counter rows', () => {
    expect(
      filledCounterRows([counter(' Deutung A '), counter(''), counter('  Deutung B  ')])
    ).toEqual([counter('Deutung A'), counter('Deutung B')]);
  });

  it('adds exactly one empty trailing row when the last counter becomes non-empty', () => {
    expect(ensureTrailingEmptyCounterRow([counter('Deutung A')])).toEqual([
      counter('Deutung A'),
      counter('')
    ]);
    expect(ensureTrailingEmptyCounterRow([counter('Deutung A'), counter('')])).toEqual([
      counter('Deutung A'),
      counter('')
    ]);
  });

  it('does not add a second empty trailing row', () => {
    const rows = [counter('A'), counter('')];
    expect(ensureTrailingEmptyCounterRow(rows)).toHaveLength(2);
  });

  it('normalizes to filled rows plus exactly one empty trailing row', () => {
    expect(
      normalizeCounterRows([counter('A'), counter('   '), counter('B'), counter('')])
    ).toEqual([counter('A'), counter('B'), counter('')]);
  });

  it('shows the remove button only when more than one counter row is filled', () => {
    const single = [counter('A'), counter('')];
    const multi = [counter('A'), counter('B'), counter('')];

    expect(shouldShowRemoveCounterRow(single, single[0]!)).toBe(false);
    expect(shouldShowRemoveCounterRow(multi, multi[0]!)).toBe(true);
    expect(shouldShowRemoveCounterRow(multi, multi[1]!)).toBe(true);
    expect(shouldShowRemoveCounterRow(multi, multi[2]!)).toBe(false);
  });
});

function uncertainty(rationale: string, level = DEFAULT_UNCERTAINTY_LEVEL): UncertaintyRow {
  return { level, rationale };
}

describe('uncertainty-row helpers', () => {
  it('returns only trimmed non-empty uncertainty rows', () => {
    expect(
      filledUncertaintyRows([uncertainty(' Begründung A '), uncertainty(''), uncertainty('  Begründung B  ')])
    ).toEqual([uncertainty('Begründung A'), uncertainty('Begründung B')]);
  });

  it('adds exactly one empty trailing row when the last uncertainty becomes non-empty', () => {
    expect(ensureTrailingEmptyUncertaintyRow([uncertainty('Begründung A')])).toEqual([
      uncertainty('Begründung A'),
      uncertainty('')
    ]);
    expect(ensureTrailingEmptyUncertaintyRow([uncertainty('Begründung A'), uncertainty('')])).toEqual([
      uncertainty('Begründung A'),
      uncertainty('')
    ]);
  });

  it('does not add a second empty trailing row', () => {
    const rows = [uncertainty('A'), uncertainty('')];
    expect(ensureTrailingEmptyUncertaintyRow(rows)).toHaveLength(2);
  });

  it('normalizes to filled rows plus exactly one empty trailing row', () => {
    expect(
      normalizeUncertaintyRows([uncertainty('A'), uncertainty('   '), uncertainty('B'), uncertainty('')])
    ).toEqual([uncertainty('A'), uncertainty('B'), uncertainty('')]);
  });

  it('shows the remove button only when more than one uncertainty row is filled', () => {
    const single = [uncertainty('A'), uncertainty('')];
    const multi = [uncertainty('A'), uncertainty('B'), uncertainty('')];

    expect(shouldShowRemoveUncertaintyRow(single, single[0]!)).toBe(false);
    expect(shouldShowRemoveUncertaintyRow(multi, multi[0]!)).toBe(true);
    expect(shouldShowRemoveUncertaintyRow(multi, multi[1]!)).toBe(true);
    expect(shouldShowRemoveUncertaintyRow(multi, multi[2]!)).toBe(false);
  });
});

describe('clearErrorKeysWithPrefix', () => {
  it('removes all keys that start with the given prefix', () => {
    const errors = {
      context: 'required',
      'counterText-0': 'error A',
      'counterText-2': 'error B',
      interpretationText: 'required'
    };
    expect(clearErrorKeysWithPrefix(errors, 'counterText-')).toEqual({
      context: 'required',
      interpretationText: 'required'
    });
  });

  it('returns the same reference when no keys match the prefix', () => {
    const errors = { context: 'required' };
    expect(clearErrorKeysWithPrefix(errors, 'counterText-')).toBe(errors);
  });

  it('removes uncertainty prefix keys without touching unrelated errors', () => {
    const errors = {
      'uncertaintyRationale-0': 'err',
      'uncertaintyRationale-3': 'stale',
      context: 'required'
    };
    expect(clearErrorKeysWithPrefix(errors, 'uncertaintyRationale-')).toEqual({
      context: 'required'
    });
  });
});
