/**
 * Server-side access control for perspectives (Blindheits-Architektur).
 *
 * These functions enforce the epistemic isolation invariants at the data layer,
 * independent of any UI logic. They must be called on every read/write path.
 *
 * Invariants:
 *   - A draft perspective is readable and writable ONLY by its owning actor.
 *   - A committed perspective is readable by any actor, but never writable.
 *   - No actor may see metadata about OTHER actors' draft perspectives
 *     (count, existence, progress).
 *   - Comparison mode (reading multiple perspectives side-by-side) requires
 *     at least 2 committed perspectives on the same case.
 */

import type { PerspectiveRecord } from "./types.js";

// ---------------------------------------------------------------------------
// Read access
// ---------------------------------------------------------------------------

/**
 * Returns true if the requesting actor may read the given perspective.
 *
 * Rules:
 *   - Draft → only the owning actor.
 *   - Committed → any actor.
 */
export function canReadPerspective(
  perspective: PerspectiveRecord,
  requestingActorId: string,
): boolean {
  if (perspective.status === "draft") {
    return perspective.actorId === requestingActorId;
  }
  // committed → readable by anyone
  return true;
}

// ---------------------------------------------------------------------------
// Write access
// ---------------------------------------------------------------------------

/**
 * Returns true if the requesting actor may modify the given perspective.
 *
 * Rules:
 *   - Draft → only the owning actor.
 *   - Committed → nobody (immutable).
 */
export function canWritePerspective(
  perspective: PerspectiveRecord,
  requestingActorId: string,
): boolean {
  if (perspective.status === "committed") {
    return false;
  }
  return perspective.actorId === requestingActorId;
}

// ---------------------------------------------------------------------------
// Comparison access
// ---------------------------------------------------------------------------

/**
 * Filters a list of perspectives to only those that are committed and
 * returns them only if there are at least `minRequired` (default 2).
 * Returns an empty array if the threshold is not met.
 *
 * This enforces: no partial comparison leaks. Either you see >= 2 committed
 * perspectives or you see none.
 */
/**
 * Filters a list of perspectives to only those that are committed and
 * returns them only if there are at least `minRequired` (default 2).
 */
export function getComparablePerspectives(
  perspectives: readonly PerspectiveRecord[],
  minRequired: number = 2,
): readonly PerspectiveRecord[] {
  const committed = perspectives.filter((p) => p.status === "committed");
  return committed.length >= minRequired ? committed : [];
}

/**
 * Enforces the strict rule: An actor may only compare perspectives if
 * their OWN perspective is committed AND there are at least `minRequired`
 * total committed perspectives.
 */
export function canComparePerspectives(
  perspectives: readonly PerspectiveRecord[],
  requestingActorId: string,
  minRequired: number = 2,
): boolean {
  const committed = perspectives.filter((p) => p.status === "committed");
  if (committed.length < minRequired) return false;

  const actorHasCommitted = committed.some((p) => p.actorId === requestingActorId);
  return actorHasCommitted;
}

// ---------------------------------------------------------------------------
// Anti-leak filter
// ---------------------------------------------------------------------------

/**
 * Filters a full list of perspectives for a case down to what a requesting
 * actor is allowed to see. This is the single choke-point that must be
 * called on every list/search path.
 *
 * Returns:
 *   - The actor's own draft (if any).
 *   - All committed perspectives.
 *   - NEVER another actor's draft.
 */
export function filterVisiblePerspectives(
  perspectives: readonly PerspectiveRecord[],
  requestingActorId: string,
): readonly PerspectiveRecord[] {
  return perspectives.filter((p) => canReadPerspective(p, requestingActorId));
}
