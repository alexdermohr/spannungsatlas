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
    expect(src).toContain('aria-atomic="true"');
    expect(src).toContain('Aktueller Schritt');
    expect(src).toContain('currentSlide');
  });

  it('SlideNav derives activeTitle from slideTitles for semantic step label', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    expect(src).toContain('activeTitle');
    expect(src).toContain('slideTitles[currentSlide - 1]');
  });

  it('SlideNav gives step buttons semantic aria-labels', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    expect(src).toContain('aria-label={`Schritt ${i + 1}:');
  });

  it('SlideNav keeps the active step live region in the accessibility tree', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    const mediaIdx = src.indexOf('@media');
    const baseRules = mediaIdx >= 0 ? src.slice(0, mediaIdx) : src;
    const ruleMatch = baseRules.match(/\.slide-nav-current\s*\{([^}]*)\}/);
    expect(ruleMatch).not.toBeNull();
    const ruleBody = ruleMatch![1];
    expect(ruleBody).not.toMatch(/display:\s*none/);
    expect(ruleBody).toMatch(/position:\s*absolute/);
    expect(ruleBody).toMatch(/width:\s*1px/);
    expect(ruleBody).toMatch(/clip:/);
  });

  it('SlideNav hides labels on mobile but keeps active step indicator visible', () => {
    const src = readFileSync(slideNavFile, 'utf-8');
    expect(src).toMatch(/max-width:\s*640px/);
    expect(src).toContain('slide-nav-label');
    expect(src).toContain('slide-nav-current');
    const mobileMediaMatch = src.match(/@media\s*\(\s*max-width:\s*640px\s*\)/);
    expect(mobileMediaMatch?.index).toBeGreaterThanOrEqual(0);
    const mobileBlock = src.slice(mobileMediaMatch!.index);
    expect(mobileBlock).toMatch(/slide-nav-current[\s\S]*?display:\s*block/);
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
    expect(src).toMatch(/each filledCounterRows/);
    expect(src).toContain('evidenceLabels[row.evidence]');
  });

  it('ReviewSlide renders uncertaintyRows as a list with level label', () => {
    const src = readFileSync(reviewSlideFile, 'utf-8');
    expect(src).toContain('filledUncertaintyRows');
    expect(src).toMatch(/each filledUncertaintyRows/);
    expect(src).toContain('uncertaintyLabels[row.level]');
  });

  it('ReviewSlide shows empty-state placeholders for counter-interpretations and uncertainties', () => {
    const src = readFileSync(reviewSlideFile, 'utf-8');
    const counterSection = src.slice(
      src.indexOf('<dt>Gegen-Deutungen</dt>'),
      src.indexOf('<dt>Unsicherheiten</dt>')
    );
    const uncertaintySection = src.slice(
      src.indexOf('<dt>Unsicherheiten</dt>'),
      src.indexOf('<dt>Exploration</dt>')
    );
    expect(counterSection).toContain('{:else}');
    expect(counterSection).toContain('— (noch leer)');
    expect(uncertaintySection).toContain('{:else}');
    expect(uncertaintySection).toContain('— (noch leer)');
  });

  it('PerspectiveCoreSlides shows a step progress indicator without a second live region', () => {
    const src = readFileSync(sharedSlidesFile, 'utf-8');
    expect(src).toContain('Schritt');
    expect(src).toContain('totalSlides');
    expect(src).toContain('currentSlide');
    expect(src).toContain('slide-progress');
    const progressMatch = src.match(/<div[^>]*class="slide-progress"[^>]*>/);
    expect(progressMatch).not.toBeNull();
    expect(progressMatch![0]).not.toContain('aria-live');
    expect(progressMatch![0]).not.toContain('role="status"');
  });

  it('PerspectiveCoreSlides remains shared across both routes', () => {
    const newCaseRoute = readFileSync(newCaseRouteFile, 'utf-8');
    const newPerspectiveRoute = readFileSync(newPerspectiveRouteFile, 'utf-8');
    expect(newCaseRoute).toContain(
      "import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';"
    );
    expect(newPerspectiveRoute).toContain(
      "import PerspectiveCoreSlides from '$lib/components/forms/PerspectiveCoreSlides.svelte';"
    );
  });
});
