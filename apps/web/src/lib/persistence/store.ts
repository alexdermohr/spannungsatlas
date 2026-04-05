import type { Case } from '$domain/types.js';
import type { CaseParticipant, Observation, ReflectionSnapshot, Revision, PerspectiveRecord } from '$domain/types.js';
import { guardCase } from '$domain/guards.js';

/** Abstraction over case persistence — swap localStorage for IndexedDB or API. */
export interface PersistenceStore {
  loadAllCases(): Case[];
  loadCase(id: string): Case | null;
  saveCase(c: Case): void;
  deleteCase(id: string): void;
  replaceAllCases(cases: readonly Case[]): void;
}

const STORAGE_KEY = 'spannungsatlas-cases';

/**
 * Checks whether a value is a non-null, non-array object (valid for migration wrapping).
 * Prevents wrapping null, strings, numbers, or arrays in a new array during migration.
 * Arrays are excluded because an already-array-shaped value must never be double-wrapped.
 */
function isMigratableObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalizes a raw ReflectionSnapshot object from storage into the current plural schema.
 * Handles forward-migration from earlier single-value fields:
 *   counterInterpretation (singular) → counterInterpretations: [value]
 *   uncertainty (singular)           → uncertainties: [value]
 *
 * Only migrates values that are valid objects (not null, strings, etc.)
 * to avoid creating invalid data from malformed legacy entries.
 */
function normalizeSnapshotFromStorage(snap: Record<string, unknown>): Record<string, unknown> {
  let changed = false;
  const updated: Record<string, unknown> = { ...snap };

  if (!Array.isArray(snap['counterInterpretations']) && snap['counterInterpretation'] !== undefined) {
    if (isMigratableObject(snap['counterInterpretation'])) {
      updated['counterInterpretations'] = [snap['counterInterpretation']];
    } else {
      console.warn('Skipped migration of non-object counterInterpretation field (type:', typeof snap['counterInterpretation'], ')');
    }
    delete updated['counterInterpretation'];
    changed = true;
  }

  if (!Array.isArray(snap['uncertainties']) && snap['uncertainty'] !== undefined) {
    if (isMigratableObject(snap['uncertainty'])) {
      updated['uncertainties'] = [snap['uncertainty']];
    } else {
      console.warn('Skipped migration of non-object uncertainty field (type:', typeof snap['uncertainty'], ')');
    }
    delete updated['uncertainty'];
    changed = true;
  }

  return changed ? updated : snap;
}

/**
 * Normalizes a raw case entry from storage into the current plural schema.
 *
 * Supports forward-migration from earlier single-value fields in:
 *   - currentReflection
 *   - revisions[*].from and revisions[*].to
 *
 * Missing or invalid fields are left for guardCase to reject.
 */
function normalizeCaseFromStorage(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const entry = raw as Record<string, unknown>;

  let changed = false;
  let updatedEntry: Record<string, unknown> = entry;

  // Normalize currentReflection
  const reflection = entry['currentReflection'];
  if (typeof reflection === 'object' && reflection !== null) {
    const normalized = normalizeSnapshotFromStorage(reflection as Record<string, unknown>);
    if (normalized !== reflection) {
      updatedEntry = { ...updatedEntry, currentReflection: normalized };
      changed = true;
    }
  }

  // Normalize revisions[*].from and revisions[*].to
  const revisions = updatedEntry['revisions'];
  if (Array.isArray(revisions)) {
    const normalizedRevisions = revisions.map((rev) => {
      if (typeof rev !== 'object' || rev === null) return rev;
      const r = rev as Record<string, unknown>;
      let revChanged = false;
      let updatedRev: Record<string, unknown> = r;

      if (typeof r['from'] === 'object' && r['from'] !== null) {
        const normFrom = normalizeSnapshotFromStorage(r['from'] as Record<string, unknown>);
        if (normFrom !== r['from']) {
          updatedRev = { ...updatedRev, from: normFrom };
          revChanged = true;
        }
      }
      if (typeof r['to'] === 'object' && r['to'] !== null) {
        const normTo = normalizeSnapshotFromStorage(r['to'] as Record<string, unknown>);
        if (normTo !== r['to']) {
          updatedRev = { ...updatedRev, to: normTo };
          revChanged = true;
        }
      }
      return revChanged ? updatedRev : r;
    });

    const anyRevChanged = normalizedRevisions.some((r, i) => r !== revisions[i]);
    if (anyRevChanged) {
      updatedEntry = { ...updatedEntry, revisions: normalizedRevisions };
      changed = true;
    }
  }

  return changed ? updatedEntry : entry;
}

/**
 * Type predicate: checks whether a normalized entry passes all Case guards.
 *
 * Performs explicit structural pre-checks before calling guardCase to prevent
 * runtime crashes — guardCase accesses nested fields (observation.text,
 * currentReflection.interpretation, participants as an iterable) without
 * null-guards of its own.
 *
 * Each `as` cast below is backed by the preceding structural check.
 * guardCase then validates the *values* of those fields (non-empty, valid enum, etc.).
 */
function isValidCase(entry: unknown): entry is Case {
  if (typeof entry !== 'object' || entry === null) return false;
  const obj = entry as Record<string, unknown>;

  // Pre-checks: ensure the fields that guardCase accesses without null-guards are present
  if (!Array.isArray(obj['participants'])) return false;
  if (!(obj['participants'] as unknown[]).every((p) => typeof p === 'object' && p !== null)) return false;
  if (!Array.isArray(obj['revisions'])) return false;
  if (!(obj['revisions'] as unknown[]).every((r) => typeof r === 'object' && r !== null)) return false;
  if (typeof obj['observation'] !== 'object' || obj['observation'] === null || Array.isArray(obj['observation'])) return false;
  if (typeof obj['currentReflection'] !== 'object' || obj['currentReflection'] === null || Array.isArray(obj['currentReflection'])) return false;
  if (obj['sources'] !== undefined && !Array.isArray(obj['sources'])) return false;
  if (
    obj['perspectives'] !== undefined &&
    (
      !Array.isArray(obj['perspectives']) ||
      !(obj['perspectives'] as unknown[]).every((p) => typeof p === 'object' && p !== null && !Array.isArray(p))
    )
  ) return false;

  return guardCase({
    id: obj['id'] as string,
    context: obj['context'] as string,
    participants: obj['participants'] as readonly CaseParticipant[],
    observation: obj['observation'] as Observation,
    currentReflection: obj['currentReflection'] as ReflectionSnapshot,
    revisions: obj['revisions'] as readonly Revision[],
    ...(typeof obj['observedAt'] === 'string' ? { observedAt: obj['observedAt'] } : {}),
    ...(Array.isArray(obj['perspectives']) ? { perspectives: obj['perspectives'] as Case['perspectives'] } : {}),
    ...(Array.isArray(obj['sources']) ? { sources: obj['sources'] as Case['sources'] } : {}),
  }).length === 0;
}

function readCases(): Case[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read cases from localStorage', error);
    return [];
  }
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .map(normalizeCaseFromStorage)
      .filter(isValidCase);
  } catch {
    return [];
  }
}

function writeCases(cases: Case[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (error) {
    console.warn('Failed to persist cases to localStorage', error);
  }
}

export const localStorageStore: PersistenceStore = {
  loadAllCases(): Case[] {
    return readCases();
  },

  loadCase(id: string): Case | null {
    return readCases().find((c) => c.id === id) ?? null;
  },

  saveCase(c: Case): void {
    const cases = [...readCases()];
    const idx = cases.findIndex((existing) => existing.id === c.id);
    if (idx >= 0) {
      cases[idx] = c;
    } else {
      cases.push(c);
    }
    writeCases(cases);
  },

  deleteCase(id: string): void {
    writeCases(readCases().filter((c) => c.id !== id));
  },

  replaceAllCases(cases: readonly Case[]): void {
    writeCases([...cases]);
  }
};
