import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const slideNavFile = 'apps/web/src/lib/components/forms/perspective-core-slides/SlideNav.svelte';
const reviewSlideFile = 'apps/web/src/lib/components/forms/perspective-core-slides/ReviewSlide.svelte';
const sharedSlidesFile = 'apps/web/src/lib/components/forms/PerspectiveCoreSlides.svelte';
const newCaseRouteFile = 'apps/web/src/routes/cases/new/+page.svelte';
const newPerspectiveRouteFile = 'apps/web/src/routes/cases/[id]/perspectives/new/+page.svelte';

describe('perspective layout invariants', () => {
  it('SlideNav contains an active step indicator with aria-live', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    expect(src).toContain('slide-nav-current');
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain('Aktueller Schritt');
    expect(src).toContain('currentSlide');
  });

  it('SlideNav derives activeTitle from slideTitles for semantic step label', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    expect(src).toContain('activeTitle');
    expect(src).toContain('slideTitles[currentSlide - 1]');
  });

  it('SlideNav hides labels on mobile but keeps active step indicator visible', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    expect(src).toMatch(/max-width:\s*640px/);
    expect(src).toContain('slide-nav-label');
    // The active step indicator class must be distinct from the hidden label
    expect(src).toContain('slide-nav-current');
    // On mobile, slide-nav-current is shown (display: block) while slide-nav-label is hidden
    const mobileBlock = src.slice(src.indexOf('@media (max-width: 640px)'));
    expect(mobileBlock).toMatch(/slide-nav-current\s*\{[^}]*display:\s*block/);
    expect(mobileBlock).toMatch(/slide-nav-label\s*\{[^}]*display:\s*none/);
  });

  it('ReviewSlide imports evidenceLabels and uncertaintyLabels', () => {
    const src = readFileSync(reviewSlideFile, 'utf-8');
    expect(src).toContain('evidenceLabels');
    expect(src).toContain('uncertaintyLabels');
    expect(src).toContain("from '$lib/ui/labels.js'");
  });

  it('ReviewSlide renders counterRows as a list, not just a count', () => {
    const src = readFileSync(reviewSlideFile, 'utf-8');
    expect(src).toContain('filledCounterRows');
    // Iterates over filled entries
    expect(src).toMatch(/each filledCounterRows/);
    // Shows evidence label
    expect(src).toContain('evidenceLabels[row.evidence]');
  });

  it('ReviewSlide renders uncertaintyRows as a list with level label', () => {
    const src = readFileSync(reviewSlideFile, 'utf-8');
    expect(src).toContain('filledUncertaintyRows');
    expect(src).toMatch(/each filledUncertaintyRows/);
    expect(src).toContain('uncertaintyLabels[row.level]');
  });

  it('ReviewSlide shows empty-state placeholder when lists are empty', () => {
    const src = readFileSync(reviewSlideFile, 'utf-8');
    // Both branches should have an else with empty placeholder
    const emptyPlaceholderCount = (src.match(/noch leer/g) ?? []).length;
    expect(emptyPlaceholderCount).toBeGreaterThanOrEqual(2);
  });

  it('PerspectiveCoreSlides shows a step progress indicator', () => {
    const src = readFileSync(sharedSlidesFile, 'utf-8');
    expect(src).toContain('Schritt');
    expect(src).toContain('totalSlides');
    expect(src).toContain('currentSlide');
    expect(src).toContain('slide-progress');
  });

  it('PerspectiveCoreSlides remains shared across both routes', () => {
    const newCaseRoute = readFileSync(newCaseRouteFile, 'utf-8');
    const newPerspectiveRoute = readFileSync(newPerspectiveRouteFile, 'utf-8');
    expect(newCaseRoute).toContain("import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';");
    expect(newPerspectiveRoute).toContain("import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';");
  });
});
