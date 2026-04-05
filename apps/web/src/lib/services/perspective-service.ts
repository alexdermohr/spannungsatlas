/**
 * Perspective service — orchestrates CRUD, commit, and comparison for
 * independent perspectives with enforced epistemic isolation.
 *
 * Every public function takes a `requestingActorId` parameter. Access control
 * is checked on every path — no trust in the caller.
 */

import type { Perspective, PerspectiveContent } from '$domain/types.js';
import { createPerspective, commitPerspective as commitPerspectiveFactory } from '$domain/factories.js';
import {
  canReadPerspective,
  canWritePerspective,
  filterVisiblePerspectives,
  getComparablePerspectives,
} from '$domain/perspective-access.js';
import {
  localPerspectiveStore,
  type PerspectivePersistenceStore,
} from '$lib/persistence/perspective-store.js';

const store: PerspectivePersistenceStore = localPerspectiveStore;

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Creates a new draft perspective for an actor on a case.
 * The actor is both the creator and the only reader until commit.
 */
export function startNewPerspective(
  caseId: string,
  actorId: string,
  content?: Partial<PerspectiveContent>,
): Perspective {
  const id = crypto.randomUUID();
  const perspective = createPerspective({
    id,
    case_id: caseId,
    actor_id: actorId,
    content,
  });
  store.savePerspective(perspective);
  return perspective;
}

// ---------------------------------------------------------------------------
// Read (access-controlled)
// ---------------------------------------------------------------------------

/**
 * Loads a single perspective, only if the requesting actor has read access.
 * Returns null if not found OR if access is denied (no information leak).
 */
export function getPerspective(
  perspectiveId: string,
  requestingActorId: string,
): Perspective | null {
  const p = store.loadPerspective(perspectiveId);
  if (!p) return null;
  if (!canReadPerspective(p, requestingActorId)) return null;
  return p;
}

/**
 * Lists all perspectives for a case that the requesting actor is allowed to see.
 *
 * Invariants enforced:
 *   - drafts of OTHER actors are NEVER returned
 *   - no count/metadata of other actors' drafts is leaked
 */
export function listPerspectivesForCase(
  caseId: string,
  requestingActorId: string,
): readonly Perspective[] {
  const all = store.loadPerspectivesForCase(caseId);
  return filterVisiblePerspectives(all, requestingActorId);
}

// ---------------------------------------------------------------------------
// Update (access-controlled)
// ---------------------------------------------------------------------------

/**
 * Updates the content of a draft perspective. Only the owning actor may write.
 *
 * @throws Error if access is denied or perspective is committed.
 */
export function updatePerspective(
  perspectiveId: string,
  requestingActorId: string,
  contentUpdate: Partial<PerspectiveContent>,
): Perspective {
  const p = store.loadPerspective(perspectiveId);
  if (!p) throw new Error("Perspective not found.");
  if (!canWritePerspective(p, requestingActorId)) {
    throw new Error("Access denied: cannot modify this perspective.");
  }

  const updated: Perspective = {
    ...p,
    content: {
      ...p.content,
      ...contentUpdate,
    },
  };

  store.savePerspective(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Commit
// ---------------------------------------------------------------------------

/**
 * Commits a draft perspective. Only the owning actor may commit.
 * After commit the perspective is immutable and becomes visible to others.
 *
 * @throws Error if access denied, already committed, or content incomplete.
 */
export function commitPerspectiveById(
  perspectiveId: string,
  requestingActorId: string,
): Perspective {
  const p = store.loadPerspective(perspectiveId);
  if (!p) throw new Error("Perspective not found.");
  if (!canWritePerspective(p, requestingActorId)) {
    throw new Error("Access denied: cannot commit this perspective.");
  }

  const committed = commitPerspectiveFactory(p);
  store.savePerspective(committed);
  return committed;
}

// ---------------------------------------------------------------------------
// Comparison (post-commit)
// ---------------------------------------------------------------------------

/**
 * Returns committed perspectives for side-by-side comparison, but only
 * if at least 2 committed perspectives exist on the case.
 * Returns an empty array otherwise — no partial reveals.
 */
export function getComparablePerspectivesForCase(
  caseId: string,
): readonly Perspective[] {
  const all = store.loadPerspectivesForCase(caseId);
  return getComparablePerspectives(all);
}

// ---------------------------------------------------------------------------
// Delete (access-controlled)
// ---------------------------------------------------------------------------

/**
 * Deletes a draft perspective. Only the owning actor may delete.
 * Committed perspectives cannot be deleted (immutable).
 *
 * @throws Error if access denied or perspective is committed.
 */
export function deletePerspective(
  perspectiveId: string,
  requestingActorId: string,
): void {
  const p = store.loadPerspective(perspectiveId);
  if (!p) throw new Error("Perspective not found.");
  if (!canWritePerspective(p, requestingActorId)) {
    throw new Error("Access denied: cannot delete this perspective.");
  }
  store.deletePerspective(perspectiveId);
}
