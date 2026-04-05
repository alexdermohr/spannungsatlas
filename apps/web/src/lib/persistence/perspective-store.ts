import type { Perspective } from '$domain/types.js';
import { guardPerspective } from '$domain/guards.js';

/** Abstraction over perspective persistence — mirrors PersistenceStore for cases. */
export interface PerspectivePersistenceStore {
  loadAllPerspectives(): Perspective[];
  loadPerspective(id: string): Perspective | null;
  loadPerspectivesForCase(caseId: string): Perspective[];
  savePerspective(p: Perspective): void;
  deletePerspective(id: string): void;
}

const STORAGE_KEY = 'spannungsatlas-perspectives';

/**
 * Type predicate: checks whether a normalized entry passes all Perspective guards.
 */
function isValidPerspective(entry: unknown): entry is Perspective {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return false;
  const obj = entry as Record<string, unknown>;

  if (typeof obj['id'] !== 'string') return false;
  if (typeof obj['case_id'] !== 'string') return false;
  if (typeof obj['actor_id'] !== 'string') return false;
  if (typeof obj['status'] !== 'string') return false;
  if (typeof obj['content'] !== 'object' || obj['content'] === null) return false;
  if (typeof obj['created_at'] !== 'string') return false;

  return guardPerspective(obj as Perspective).length === 0;
}

function readPerspectives(): Perspective[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read perspectives from localStorage', error);
    return [];
  }
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(isValidPerspective);
  } catch {
    return [];
  }
}

function writePerspectives(perspectives: Perspective[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perspectives));
  } catch (error) {
    console.warn('Failed to persist perspectives to localStorage', error);
  }
}

export const localPerspectiveStore: PerspectivePersistenceStore = {
  loadAllPerspectives(): Perspective[] {
    return readPerspectives();
  },

  loadPerspective(id: string): Perspective | null {
    return readPerspectives().find((p) => p.id === id) ?? null;
  },

  loadPerspectivesForCase(caseId: string): Perspective[] {
    return readPerspectives().filter((p) => p.case_id === caseId);
  },

  savePerspective(p: Perspective): void {
    const all = [...readPerspectives()];
    const idx = all.findIndex((existing) => existing.id === p.id);
    if (idx >= 0) {
      all[idx] = p;
    } else {
      all.push(p);
    }
    writePerspectives(all);
  },

  deletePerspective(id: string): void {
    writePerspectives(readPerspectives().filter((p) => p.id !== id));
  },
};
