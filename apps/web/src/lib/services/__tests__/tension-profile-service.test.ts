import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveTensionProfileInput } from '../tension-profile-service.js';
import {
  findTensionProfilesForPerson,
  getAllTensionProfiles,
  saveTensionProfile
} from '../tension-profile-service.js';

const STORAGE_KEY = 'spannungsatlas-tension-profiles';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}

function baseInput(overrides: Partial<SaveTensionProfileInput> = {}): SaveTensionProfileInput {
  return {
    personId: 'Anna',
    patternDescription: 'Spannung zeigt sich unter öffentlichem Zeitdruck als Rückzug.',
    needPressures: ['Orientierung und Vorhersagbarkeit'],
    determinants: ['öffentliche Situation'],
    expressionForms: ['Rückzug'],
    reliefConditions: ['ruhige Einzelklärung'],
    evidenceLevel: 'weak',
    epistemicMarking: 'plausible',
    counterEvidence: [],
    support: {
      caseIds: ['case-1', 'case-2'],
      distinctTimepoints: 2,
      distinctContexts: 1,
      multiSourceCorroboration: false,
      lastSupportingCaseAt: '2026-01-01T00:00:00.000Z'
    },
    revisedAt: '2026-01-02T00:00:00.000Z',
    ...overrides
  };
}

describe('tension-profile-service', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new LocalStorageMock());
    vi.stubGlobal('crypto', { randomUUID: () => 'profile-id' });
  });

  it('saves a valid weak profile through the domain factory', () => {
    const profile = saveTensionProfile(baseInput());

    expect(profile.id).toBe('profile-id');
    expect(profile.personId).toBe('Anna');
    expect(profile.evidenceLevel).toBe('weak');
    expect(getAllTensionProfiles()).toHaveLength(1);
  });

  it('discards invalid localStorage entries while keeping valid profiles', () => {
    const valid = saveTensionProfile(baseInput());
    localStorage.setItem(STORAGE_KEY, JSON.stringify([valid, { id: '', personId: 'Broken' }]));

    const profiles = getAllTensionProfiles();

    expect(profiles).toEqual([valid]);
  });

  it('allows a weak profile with one case and robust multi-source corroboration', () => {
    const profile = saveTensionProfile(baseInput({
      support: {
        caseIds: ['case-1'],
        distinctTimepoints: 1,
        distinctContexts: 1,
        multiSourceCorroboration: true,
        lastSupportingCaseAt: '2026-01-01T00:00:00.000Z'
      }
    }));

    expect(profile.evidenceLevel).toBe('weak');
    expect(profile.support.caseIds).toEqual(['case-1']);
    expect(profile.support.multiSourceCorroboration).toBe(true);
  });

  it('filters profiles by personId and sorts by revisedAt descending', () => {
    saveTensionProfile(baseInput({ revisedAt: '2026-01-01T00:00:00.000Z' }));
    saveTensionProfile(baseInput({ personId: 'Ben', revisedAt: '2026-06-01T00:00:00.000Z' }));
    saveTensionProfile(baseInput({ revisedAt: '2026-03-01T00:00:00.000Z' }));

    const annaProfiles = findTensionProfilesForPerson('Anna').map(({ profile }) => profile.revisedAt);

    expect(annaProfiles).toEqual(['2026-03-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
  });

  it('passes revision_due decay status from the domain evaluator', () => {
    saveTensionProfile(baseInput({
      support: {
        ...baseInput().support,
        lastSupportingCaseAt: '2025-01-01T00:00:00.000Z'
      }
    }));

    const [entry] = findTensionProfilesForPerson('Anna', '2026-01-01T00:00:00.000Z');

    expect(entry.decay.status).toBe('revision_due');
    expect(entry.decay.daysSinceLastSupport).toBeGreaterThan(180);
  });

  it('rejects a strong profile without counter-evidence', () => {
    expect(() => saveTensionProfile(baseInput({
      evidenceLevel: 'strong',
      support: {
        caseIds: ['case-1', 'case-2', 'case-3', 'case-4'],
        distinctTimepoints: 2,
        distinctContexts: 2,
        multiSourceCorroboration: false,
        lastSupportingCaseAt: '2026-01-01T00:00:00.000Z'
      }
    }))).toThrow('strong profile entry requires at least one documented Gegenbeleg');
  });

  it('rejects a strong profile marked speculative', () => {
    expect(() => saveTensionProfile(baseInput({
      evidenceLevel: 'strong',
      epistemicMarking: 'speculative',
      counterEvidence: [{ kind: 'checked_none', checkedAt: '2026-01-02T00:00:00.000Z' }],
      support: {
        caseIds: ['case-1', 'case-2', 'case-3', 'case-4'],
        distinctTimepoints: 2,
        distinctContexts: 2,
        multiSourceCorroboration: false,
        lastSupportingCaseAt: '2026-01-01T00:00:00.000Z'
      }
    }))).toThrow('must not be marked speculative');
  });
});
