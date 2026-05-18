import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const routeFile =
  'apps/web/src/routes/cases/[id]/perspectives/[perspectiveId]/exploration/+page.svelte';
const coreSlidesFile = 'apps/web/src/lib/components/forms/PerspectiveCoreSlides.svelte';
const caseDetailFile = 'apps/web/src/routes/cases/[id]/+page.svelte';

describe('post-commit exploration route', () => {
  it('exists as a dedicated SvelteKit route', () => {
    expect(existsSync(routeFile)).toBe(true);
  });

  it('imports ExplorationSlide for the post-commit workflow', () => {
    const src = readFileSync(routeFile, 'utf-8');
    expect(src).toContain(
      "import ExplorationSlide from '$lib/components/forms/perspective-core-slides/ExplorationSlide.svelte';"
    );
    expect(src).toContain('<ExplorationSlide');
  });

  it('uses savePerspectiveExploration from the service layer', () => {
    const src = readFileSync(routeFile, 'utf-8');
    expect(src).toContain('savePerspectiveExploration');
  });

  it('labels the workflow as nachgelagert / nach Abschluss', () => {
    const src = readFileSync(routeFile, 'utf-8');
    expect(
      src.includes('nach Abschluss') || src.includes('nachgelagerte Exploration')
    ).toBe(true);
  });

  it('keeps PerspectiveCoreSlides free of ExplorationSlide and stays 5 steps', () => {
    const slides = readFileSync(coreSlidesFile, 'utf-8');
    expect(slides).not.toContain('ExplorationSlide');
    expect(slides).toContain("'5. Prüfen'");
  });

  it('exposes the post-commit entry point on the case detail page', () => {
    const src = readFileSync(caseDetailFile, 'utf-8');
    expect(src).toContain('/exploration?actor=');
    expect(src).toContain('Nachgelagerte Exploration');
  });

  it('URL-encodes the actor id (and path segments) in the post-commit exploration link', () => {
    const src = readFileSync(caseDetailFile, 'utf-8');
    expect(src).toContain('encodeURIComponent(demoActorId)');
    expect(src).toContain('encodeURIComponent(caseData.id)');
    expect(src).toContain('encodeURIComponent(ownCommittedPerspectiveId)');
  });

  it('reads the perspectiveId from the route parameter, not from the URL search', () => {
    const src = readFileSync(routeFile, 'utf-8');
    expect(src).toContain('page.params.perspectiveId');
    expect(src).toContain("page.url.searchParams.get('actor')");
  });
});
