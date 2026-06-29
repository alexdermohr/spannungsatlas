import type { CounterEvidence, EvidenceLevel, EpistemicMarking, TensionProfile } from '$domain/types.js';
import {
  createTensionProfile,
  evaluateProfileDecay,
  type ProfileDecayStatus
} from '$domain/tension-profile.js';

const STORAGE_KEY = 'spannungsatlas-tension-profiles';

function readProfiles(): TensionProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry) => {
      try {
        return [createTensionProfile(entry as Parameters<typeof createTensionProfile>[0])];
      } catch (error) {
        console.warn('Skipped invalid tension profile from localStorage', error);
        return [];
      }
    });
  } catch (error) {
    console.warn('Failed to read tension profiles from localStorage', error);
    return [];
  }
}

function writeProfiles(profiles: readonly TensionProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.warn('Failed to persist tension profiles to localStorage', error);
  }
}

export interface SaveTensionProfileInput {
  personId: string;
  patternDescription: string;
  needPressures: readonly string[];
  determinants: readonly string[];
  expressionForms: readonly string[];
  reliefConditions: readonly string[];
  evidenceLevel: EvidenceLevel;
  epistemicMarking: EpistemicMarking;
  counterEvidence: readonly CounterEvidence[];
  support: {
    caseIds: readonly string[];
    distinctTimepoints: number;
    distinctContexts: number;
    multiSourceCorroboration: boolean;
    lastSupportingCaseAt: string;
  };
  revisedAt: string;
}

export interface TensionProfileWithDecay {
  profile: TensionProfile;
  decay: ProfileDecayStatus;
}

export function getAllTensionProfiles(): TensionProfile[] {
  return readProfiles();
}

export function findTensionProfilesForPerson(personId: string, asOfIso = new Date().toISOString()): TensionProfileWithDecay[] {
  return readProfiles()
    .filter((profile) => profile.personId === personId)
    .sort((a, b) => b.revisedAt.localeCompare(a.revisedAt))
    .map((profile) => ({ profile, decay: evaluateProfileDecay(profile, asOfIso) }));
}

export function saveTensionProfile(input: SaveTensionProfileInput): TensionProfile {
  const now = new Date().toISOString();
  const profile = createTensionProfile({
    id: crypto.randomUUID(),
    personId: input.personId,
    patternDescription: input.patternDescription,
    needPressures: input.needPressures,
    determinants: input.determinants,
    expressionForms: input.expressionForms,
    reliefConditions: input.reliefConditions,
    evidenceLevel: input.evidenceLevel,
    epistemicMarking: input.epistemicMarking,
    counterEvidence: input.counterEvidence,
    support: input.support,
    revisedAt: input.revisedAt,
    createdAt: now
  });

  writeProfiles([...readProfiles(), profile]);
  return profile;
}
