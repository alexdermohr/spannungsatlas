import type { Case } from '$domain/types.js';
import { guardCase } from '$domain/guards.js';

/** Abstraction over case persistence — swap localStorage for IndexedDB or API. */
export interface PersistenceStore {
  loadAllCases(): Case[];
  loadCase(id: string): Case | null;
  saveCase(c: Case): void;
  deleteCase(id: string): void;
}

const STORAGE_KEY = 'spannungsatlas-cases';

function isStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

function readCases(): Case[] {
  if (!isStorageAvailable()) return [];
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    console.warn('Failed to read cases from localStorage');
    return [];
  }
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (entry) => typeof entry === 'object' && entry !== null && guardCase(entry as Case).length === 0
    ) as Case[];
  } catch {
    return [];
  }
}

function writeCases(cases: Case[]): void {
  if (!isStorageAvailable()) return;
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
    const cases = readCases();
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
  }
};
