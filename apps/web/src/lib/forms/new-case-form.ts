import type { ParticipantRole } from '$domain/types.js';

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
