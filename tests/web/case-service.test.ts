import { beforeEach, describe, expect, it } from 'vitest';
import {
  addRevision,
  getAllCases,
  getCase,
  startNewCase,
  type AddRevisionInput,
  type StartNewCaseInput
} from '../../apps/web/src/lib/services/case-service.js';

type LocalStorageMock = {
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  readonly length: number;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
};

function createLocalStorageMock(): LocalStorageMock {
  const store = new Map<string, string>();

  return {
    clear(): void {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    key(index: number): string | null {
      return [...store.keys()][index] ?? null;
    },
    get length(): number {
      return store.size;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    }
  };
}

function validCaseInput(): StartNewCaseInput {
  return {
    context: 'Klassenraum, Montag 8:15 Uhr',
    participantName: 'Kind A',
    participantRole: 'primary',
    observationText: 'Kind A schlägt mit der Hand auf den Tisch.',
    isCameraDescribable: true,
    interpretationText: 'Kind A zeigt körperliche Anspannung.',
    interpretationEvidenceType: 'observational',
    counterInterpretationText: 'Kind A sucht möglicherweise Aufmerksamkeit.',
    counterInterpretationEvidenceType: 'derived',
    uncertaintyLevel: 3,
    uncertaintyRationale: 'Nur ein Einzelereignis beobachtet.'
  };
}

function validRevisionInput(): AddRevisionInput {
  return {
    interpretationText: 'Kind A wirkt nach weiterem Gespräch eher überfordert als angespannt.',
    interpretationEvidenceType: 'derived',
    counterInterpretationText: 'Kind A reagiert möglicherweise auf die Gruppensituation.',
    counterInterpretationEvidenceType: 'derived',
    uncertaintyLevel: 2,
    uncertaintyRationale: 'Zusätzliche Rückmeldung der Fachkraft liegt vor.',
    driftType: 'new_perspective',
    reason: 'Rücksprache mit Kollegin eröffnete einen anderen Blick auf dieselbe Beobachtung.'
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createLocalStorageMock(),
    configurable: true,
    writable: true
  });
});

describe('addRevision', () => {
  it('legt bei bestehendem Fall eine Revision an und ersetzt currentReflection', () => {
    const created = startNewCase(validCaseInput());
    const previousReflection = created.currentReflection;

    const updated = addRevision(created.id, validRevisionInput());

    expect(updated.currentReflection).not.toEqual(previousReflection);
    expect(updated.currentReflection.interpretation.text).toBe(
      'Kind A wirkt nach weiterem Gespräch eher überfordert als angespannt.'
    );
    expect(updated.revisions).toHaveLength(1);
    expect(updated.revisions[0]?.from).toEqual(previousReflection);
    expect(updated.revisions[0]?.to).toEqual(updated.currentReflection);
  });

  it('übernimmt driftType und reason in die angehängte Revision', () => {
    const created = startNewCase(validCaseInput());

    const updated = addRevision(created.id, validRevisionInput());
    const revision = updated.revisions[0];

    expect(revision?.driftType).toBe('new_perspective');
    expect(revision?.reason).toBe(
      'Rücksprache mit Kollegin eröffnete einen anderen Blick auf dieselbe Beobachtung.'
    );
  });

  it('persistiert Revisionen so, dass load-by-id und load-all den neuen Denkstand wiedergeben', () => {
    const created = startNewCase(validCaseInput());

    addRevision(created.id, validRevisionInput());

    const loaded = getCase(created.id);
    const allCases = getAllCases();

    expect(loaded).not.toBeNull();
    expect(loaded?.revisions).toHaveLength(1);
    expect(loaded?.currentReflection.interpretation.text).toBe(
      'Kind A wirkt nach weiterem Gespräch eher überfordert als angespannt.'
    );
    expect(allCases).toHaveLength(1);
    expect(allCases[0]?.revisions).toHaveLength(1);
  });

  it('wirft einen Fehler bei unbekannter caseId', () => {
    expect(() => addRevision('missing-case', validRevisionInput())).toThrow(
      'Fall mit ID missing-case nicht gefunden.'
    );
  });
});
