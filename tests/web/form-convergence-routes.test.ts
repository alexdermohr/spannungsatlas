import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const newCaseRouteFile = 'apps/web/src/routes/cases/new/+page.svelte';
const newPerspectiveRouteFile = 'apps/web/src/routes/cases/[id]/perspectives/new/+page.svelte';
const sharedSlidesFile = 'apps/web/src/lib/components/forms/PerspectiveCoreSlides.svelte';
const explorationSlideFile = 'apps/web/src/lib/components/forms/perspective-core-slides/ExplorationSlide.svelte';

describe('form convergence route wiring', () => {
  it('renders PerspectiveCoreSlides from both routes', () => {
    const newCaseRoute = readFileSync(newCaseRouteFile, 'utf-8');
    const newPerspectiveRoute = readFileSync(newPerspectiveRouteFile, 'utf-8');

    expect(newCaseRoute).toContain("import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';");
    expect(newCaseRoute).toContain('<PerspectiveCoreSlides');

    expect(newPerspectiveRoute).toContain("import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';");
    expect(newPerspectiveRoute).toContain('<PerspectiveCoreSlides');
  });

  it('keeps exploration as a dedicated shared slide instead of route-local inline UI', () => {
    const newCaseRoute = readFileSync(newCaseRouteFile, 'utf-8');
    const newPerspectiveRoute = readFileSync(newPerspectiveRouteFile, 'utf-8');
    const sharedSlides = readFileSync(sharedSlidesFile, 'utf-8');
    const explorationSlide = readFileSync(explorationSlideFile, 'utf-8');

    expect(sharedSlides).toContain('2. Explorationsraum');
    expect(sharedSlides).toContain("import ExplorationSlide from '$lib/components/forms/perspective-core-slides/ExplorationSlide.svelte';");
    expect(sharedSlides).toContain('bind:activeClusterId');
    expect(sharedSlides).toContain('bind:selectionSearch');

    expect(newCaseRoute).not.toContain('isExplorationOpen');
    expect(newPerspectiveRoute).not.toContain('isExplorationOpen');
    expect(newCaseRoute).not.toContain('filterCatalogItems');
    expect(newPerspectiveRoute).not.toContain('filterCatalogItems');
    expect(newCaseRoute).not.toContain('ExplorationSlide');
    expect(newPerspectiveRoute).not.toContain('ExplorationSlide');

    expect(explorationSlide).not.toContain('let activeClusterId = $state');
    expect(explorationSlide).not.toContain('let selectionSearch = $state');
    expect(explorationSlide).toContain('activeClusterId = $bindable<string>()');
    expect(explorationSlide).toContain('selectionSearch = $bindable<string>()');
  });

  it('documents route-specific autosave behavior at the usage sites', () => {
    const newCaseRoute = readFileSync(newCaseRouteFile, 'utf-8');
    const newPerspectiveRoute = readFileSync(newPerspectiveRouteFile, 'utf-8');

    expect(newCaseRoute).not.toContain('onChange={saveDraft}');
    expect(newPerspectiveRoute).toContain('onChange={saveDraft}');
  });
});