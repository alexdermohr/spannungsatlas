import type { ParticipantRole, EvidenceType } from '$domain/types.js';

export interface ParticipantRow {
  name: string;
  role: ParticipantRole;
}

export function filledParticipants(participants: ParticipantRow[]): ParticipantRow[] {
  return participants
    .filter((participant) => participant.name.trim() !== '')
    .map((participant) => ({ ...participant, name: participant.name.trim() }));
}

export function ensureTrailingEmptyRow(participants: ParticipantRow[]): ParticipantRow[] {
  const last = participants[participants.length - 1];
  if (last && last.name.trim() !== '') {
    return [...participants, { name: '', role: 'primary' }];
  }
  return participants;
}

export function normalizeParticipants(participants: ParticipantRow[]): ParticipantRow[] {
  return [...filledParticipants(participants), { name: '', role: 'primary' }];
}

export function shouldShowRemoveParticipant(
  participants: ParticipantRow[],
  row: ParticipantRow
): boolean {
  return row.name.trim() !== '' && filledParticipants(participants).length > 1;
}

export function refreshFieldErrors(
  fieldErrors: Record<string, string>,
  nextErrors: Record<string, string>,
  keys: string[]
): Record<string, string> {
  if (Object.keys(fieldErrors).length === 0) return fieldErrors;

  const updated = { ...fieldErrors };
  let changed = false;

  for (const key of [...keys, '_submit']) {
    const nextValue = nextErrors[key];
    if (nextValue) {
      if (updated[key] !== nextValue) {
        updated[key] = nextValue;
        changed = true;
      }
      continue;
    }

    if (key in updated) {
      delete updated[key];
      changed = true;
    }
  }

  return changed ? updated : fieldErrors;
}

export interface CounterRow {
  text: string;
  evidence: EvidenceType;
}

export const DEFAULT_COUNTER_EVIDENCE: EvidenceType = 'derived';

export function filledCounterRows(rows: CounterRow[]): CounterRow[] {
  return rows
    .filter((r) => r.text.trim() !== '')
    .map((r) => ({ ...r, text: r.text.trim() }));
}

export function ensureTrailingEmptyCounterRow(rows: CounterRow[]): CounterRow[] {
  const last = rows[rows.length - 1];
  if (last && last.text.trim() !== '') {
    return [...rows, { text: '', evidence: DEFAULT_COUNTER_EVIDENCE }];
  }
  return rows;
}

export function normalizeCounterRows(rows: CounterRow[]): CounterRow[] {
  return [...filledCounterRows(rows), { text: '', evidence: DEFAULT_COUNTER_EVIDENCE }];
}

export function shouldShowRemoveCounterRow(rows: CounterRow[], row: CounterRow): boolean {
  return row.text.trim() !== '' && filledCounterRows(rows).length > 1;
}
