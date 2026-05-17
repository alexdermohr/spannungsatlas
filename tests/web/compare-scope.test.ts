import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { PERSPECTIVE_PHASE } from '$domain/perspective-access.js';

/**
 * Strict-blind invariants for the Compare surface.
 *
 * In `phase-1-strict-blind` the domain layer (perspective-access.ts) blocks
 * comparison globally. The UI must not invent its own comparison gate or
 * leak case metadata that would let an actor infer the presence and shape
 * of other perspectives before they have committed their own.
 *
 * These tests do not assert anything about phases beyond Phase 1. They are
 * intended to fail loudly when someone re-introduces the previously
 * reverted compare overview while the domain phase is still strict-blind.
 */
describe('Compare surface scope guard (Phase 1 strict-blind)', () => {
  const compareRoute = 'apps/web/src/routes/compare/+page.svelte';
  const layoutFile = 'apps/web/src/routes/+layout.svelte';
  const caseDetailFile = 'apps/web/src/routes/cases/[id]/+page.svelte';
  const catalogDataFile = 'apps/web/src/lib/catalog/catalog-data.ts';

  it('runs against phase-1-strict-blind', () => {
    expect(PERSPECTIVE_PHASE).toBe('phase-1-strict-blind');
  });

  it('does not list cases on the compare overview', () => {
    expect(existsSync(compareRoute)).toBe(true);
    const content = readFileSync(compareRoute, 'utf-8');

    expect(content).not.toContain('getAllCases');
    expect(content).not.toMatch(/committed\s*>=\s*2/);
    expect(content).not.toContain("from '$lib/services/case-service");
  });

  it('keeps the compare navigation link inactive in the topnav', () => {
    const content = readFileSync(layoutFile, 'utf-8');

    expect(content).not.toMatch(/href=["']\/compare["']/);
    expect(content).toContain('Vergleich');
    expect(content).toContain('nav-inactive');
  });

  it('activates the catalog navigation link', () => {
    const content = readFileSync(layoutFile, 'utf-8');

    expect(content).toMatch(/href=["']\/catalog["']/);
  });

  it('does not surface a "Perspektiven vergleichen" link on the case detail page', () => {
    const content = readFileSync(caseDetailFile, 'utf-8');

    expect(content).not.toContain('Perspektiven vergleichen');
    expect(content).not.toMatch(/href=["']\/cases\/\{caseData\.id\}\/compare/);
  });

  it('keeps catalog-data imports behind the $data alias', () => {
    const content = readFileSync(catalogDataFile, 'utf-8');

    expect(content).toContain("from '$data/catalog/needs.json'");
    expect(content).toContain("from '$data/catalog/determinants.json'");
    expect(content).toContain("from '$data/catalog/clusters.json'");
    expect(content).not.toMatch(/from\s+['"](?:\.\.\/){3,}data\//);
  });
});
