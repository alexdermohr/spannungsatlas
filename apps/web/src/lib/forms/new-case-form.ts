import type { ParticipantRole, EvidenceType, UncertaintyLevel } from '$domain/types.js';

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

/**
 * Removes all error keys whose name starts with `prefix`.
 * Use before re-validating dynamic list prefixes (e.g. 'counterText-', 'uncertaintyRationale-')
 * so that stale indices left over from removed rows are cleaned up.
 *
 * @param fieldErrors - current error map
 * @param prefix - key prefix to match (e.g. `'counterText-'`)
 * @returns a new error map without matching keys, or the same reference if nothing changed
 */
export function clearErrorKeysWithPrefix(
  fieldErrors: Record<string, string>,
  prefix: string
): Record<string, string> {
  let changed = false;
  const updated = { ...fieldErrors };
  for (const key of Object.keys(updated)) {
    if (key.startsWith(prefix)) {
      delete updated[key];
      changed = true;
    }
  }
  return changed ? updated : fieldErrors;
}

/**
 * Merges all error keys from `nextErrors` that start with `prefix` into `current`.
 * Use after clearErrorKeysWithPrefix + validate() to re-apply any newly-required
 * errors for the prefix family, even when `current` is empty (bypassing the
 * early-return guard in refreshFieldErrors).
 *
 * @param current - current error map (may be empty after a prefix-clear)
 * @param nextErrors - freshly computed error map from validate()
 * @param prefix - key prefix to merge (e.g. `'counterText-'`)
 * @returns a new error map with prefix errors from nextErrors applied, or the same
 *          reference if nextErrors contains no matching keys
 */
export function applyPrefixErrors(
  current: Record<string, string>,
  nextErrors: Record<string, string>,
  prefix: string
): Record<string, string> {
  const toMerge: Record<string, string> = {};
  for (const [key, val] of Object.entries(nextErrors)) {
    if (key.startsWith(prefix)) toMerge[key] = val;
  }
  if (Object.keys(toMerge).length === 0) return current;
  return { ...current, ...toMerge };
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

export interface UncertaintyRow {
  level: UncertaintyLevel;
  rationale: string;
}

export const DEFAULT_UNCERTAINTY_LEVEL: UncertaintyLevel = 3;

export function filledUncertaintyRows(rows: UncertaintyRow[]): UncertaintyRow[] {
  return rows
    .filter((r) => r.rationale.trim() !== '')
    .map((r) => ({ ...r, rationale: r.rationale.trim() }));
}

export function ensureTrailingEmptyUncertaintyRow(rows: UncertaintyRow[]): UncertaintyRow[] {
  const last = rows[rows.length - 1];
  if (last && last.rationale.trim() !== '') {
    return [...rows, { level: DEFAULT_UNCERTAINTY_LEVEL, rationale: '' }];
  }
  return rows;
}

export function normalizeUncertaintyRows(rows: UncertaintyRow[]): UncertaintyRow[] {
  return [...filledUncertaintyRows(rows), { level: DEFAULT_UNCERTAINTY_LEVEL, rationale: '' }];
}

export function shouldShowRemoveUncertaintyRow(rows: UncertaintyRow[], row: UncertaintyRow): boolean {
  return row.rationale.trim() !== '' && filledUncertaintyRows(rows).length > 1;
}
