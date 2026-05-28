import type { Case, CaseParticipant, ParticipantRole } from '$domain/types.js';

/**
 * Aggregated overview of one person across all dokumentierten Fälle.
 *
 * Scope (Phase 2b / vor Phase 5):
 *   - Diese Struktur ist eine reine Navigationsaggregation.
 *   - Sie ist KEIN Spannungsprofil im Sinne von MASTERPLAN §3.2.
 *   - Es findet keine Verdichtung, keine Musterableitung und keine Bewertung statt.
 *   - Sichtbar ist nur, was auf Fallebene ohnehin dokumentiert ist.
 *
 * Die Person wird über die vom Nutzer vergebene `CaseParticipant.id` identifiziert
 * (in V1 ein freier Name). Es findet keine cross-Case-Identitätsauflösung statt.
 */
export interface PersonSummary {
  readonly id: string;
  readonly roles: readonly ParticipantRole[];
  readonly caseCount: number;
  readonly lastActivity: string | null;
}

function compareByLastActivityDescThenId(a: PersonSummary, b: PersonSummary): number {
  if (a.lastActivity && b.lastActivity) {
    if (a.lastActivity === b.lastActivity) return a.id.localeCompare(b.id);
    return b.lastActivity.localeCompare(a.lastActivity);
  }
  if (a.lastActivity) return -1;
  if (b.lastActivity) return 1;
  return a.id.localeCompare(b.id);
}

function compareCasesByReflectedAtDesc(a: Case, b: Case): number {
  const ar = a.currentReflection?.reflectedAt ?? '';
  const br = b.currentReflection?.reflectedAt ?? '';
  return br.localeCompare(ar);
}

/**
 * Aggregates all distinct persons across the given cases.
 *
 * - Roles are collected as the union of roles a person has played across cases.
 *   Identical persons (same id) appearing in two cases with different roles
 *   will list both roles.
 * - `lastActivity` is the latest `currentReflection.reflectedAt` of any case the
 *   person appears in. It is null if no case has a reflectedAt timestamp.
 * - Result is sorted by lastActivity desc (newest first), tie-broken by id asc.
 */
export function aggregatePeopleFromCases(cases: readonly Case[]): readonly PersonSummary[] {
  const byId = new Map<
    string,
    { roles: Set<ParticipantRole>; caseCount: number; lastActivity: string | null }
  >();

  for (const c of cases) {
    const reflectedAt = c.currentReflection?.reflectedAt ?? null;
    const seenInCase = new Set<string>();
    for (const p of c.participants) {
      const existing = byId.get(p.id) ?? {
        roles: new Set<ParticipantRole>(),
        caseCount: 0,
        lastActivity: null
      };
      if (p.role) existing.roles.add(p.role);
      if (!seenInCase.has(p.id)) {
        existing.caseCount += 1;
        seenInCase.add(p.id);
      }
      if (reflectedAt && (!existing.lastActivity || reflectedAt > existing.lastActivity)) {
        existing.lastActivity = reflectedAt;
      }
      byId.set(p.id, existing);
    }
  }

  const summaries: PersonSummary[] = [];
  for (const [id, info] of byId) {
    summaries.push({
      id,
      roles: Array.from(info.roles).sort(),
      caseCount: info.caseCount,
      lastActivity: info.lastActivity
    });
  }
  summaries.sort(compareByLastActivityDescThenId);
  return summaries;
}

/**
 * Returns all cases a given person participates in, sorted newest first
 * (by currentReflection.reflectedAt descending). Cases without a reflectedAt
 * timestamp sort to the end.
 */
export function findCasesForPerson(
  personId: string,
  cases: readonly Case[]
): readonly Case[] {
  const matches = cases.filter((c) =>
    c.participants.some((p) => p.id === personId)
  );
  matches.sort(compareCasesByReflectedAtDesc);
  return matches;
}

/**
 * Returns the summary entry for one person, or null if the person does not
 * appear in any of the given cases.
 */
export function findPersonSummary(
  personId: string,
  cases: readonly Case[]
): PersonSummary | null {
  for (const summary of aggregatePeopleFromCases(cases)) {
    if (summary.id === personId) return summary;
  }
  return null;
}

/**
 * Returns the role this person had in this specific case (if any). The same
 * person can have different roles in different cases; this lookup is per-case
 * and does NOT use the aggregated `PersonSummary.roles`.
 */
export function findRoleForPersonInCase(
  personId: string,
  c: Case
): ParticipantRole | undefined {
  const found: CaseParticipant | undefined = c.participants.find(
    (p) => p.id === personId
  );
  return found?.role;
}
