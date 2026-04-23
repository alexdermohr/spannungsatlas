import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 2a route scope guard', () => {
  it('does not include a standalone perspectives overview route', () => {
    const overviewRoute = 'apps/web/src/routes/cases/[id]/perspectives/+page.svelte';
    expect(existsSync(overviewRoute)).toBe(false);
  });

  it('keeps case detail navigation focused on capture route', () => {
    const caseDetailFile = 'apps/web/src/routes/cases/[id]/+page.svelte';
    const content = readFileSync(caseDetailFile, 'utf-8');

    expect(content).toContain('/perspectives/new?actor=');
    expect(content).not.toContain('/perspectives?actor=');
  });

  it('does not link from capture form to removed perspectives overview', () => {
    const createFormFile = 'apps/web/src/routes/cases/[id]/perspectives/new/+page.svelte';
    const content = readFileSync(createFormFile, 'utf-8');

    expect(content).not.toContain('/perspectives?actor=');
  });
});
