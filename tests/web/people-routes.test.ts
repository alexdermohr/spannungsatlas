import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Route-invariant tests for the people directory feature.
 *
 * These tests protect the product boundary: person overview yes,
 * profiling no. They also guard against URL-handling regressions
 * in the person detail route.
 */
describe('People route invariants', () => {
  const layoutFile = 'apps/web/src/routes/+layout.svelte';
  const caseDetailFile = 'apps/web/src/routes/cases/[id]/+page.svelte';
  const peoplePage = 'apps/web/src/routes/people/+page.svelte';
  const personDetailPage = 'apps/web/src/routes/people/[id]/+page.svelte';

  it('topnav contains a /people link', () => {
    const content = readFileSync(layoutFile, 'utf-8');
    expect(content).toContain('href="/people"');
  });

  it('case detail links participants with encodeURIComponent', () => {
    const content = readFileSync(caseDetailFile, 'utf-8');
    expect(content).toContain('encodeURIComponent(p.id)');
    expect(content).toContain('/people/');
  });

  it('people list links person cards with encodeURIComponent', () => {
    const content = readFileSync(peoplePage, 'utf-8');
    expect(content).toContain('href={`/people/${encodeURIComponent(person.id)}`}');
    expect(content).not.toContain('href="/people/{encodeURIComponent(person.id)}"');
  });

  it('people list page mentions Navigationsaggregation', () => {
    const content = readFileSync(peoplePage, 'utf-8');
    expect(content).toContain('Navigationsaggregation');
  });

  it('people list page declares no Spannungsprofil', () => {
    const content = readFileSync(peoplePage, 'utf-8');
    expect(content).toContain('kein Spannungsprofil');
  });

  it('person detail page mentions keine Verdichtung', () => {
    const content = readFileSync(personDetailPage, 'utf-8');
    expect(content).toMatch(/keine.*Verdichtung/);
  });

  it('person detail page declares kein Spannungsprofil', () => {
    const content = readFileSync(personDetailPage, 'utf-8');
    expect(content).toMatch(/kein.*Spannungsprofil/);
  });

  it('person detail route does not double-decode the route param', () => {
    const content = readFileSync(personDetailPage, 'utf-8');
    expect(content).not.toContain('decodeURIComponent(raw)');
    expect(content).not.toContain('decodeURIComponent(page.params.id)');
  });
});
