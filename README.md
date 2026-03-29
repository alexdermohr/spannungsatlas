---
id: readme
title: "Spannungsatlas"
doc_type: readme
status: active
canonicality: informational
summary: "Repo-Einstieg mit Kurzbeschreibung und Verweis auf das kanonische Produktdokument."
related_docs:
  - masterplan
  - deploy-blaupause
  - roadmap
last_reviewed: "2026-03-29"
---

# Spannungsatlas

Spannungsatlas ist ein pädagogisches Dokumentations-, Reflexions- und Vordiagnostiksystem. Es verbindet Fallarbeit, revidierbare Spannungsprofile von Personen und Konstellationsanalyse von Situationen im Zeitverlauf. Spätere Ausbaustufen können zusätzlich reduzierte Spannungskonstellationen als systemischen Zusatzlayer ergänzen. Der Kern ist nicht Diagnose, sondern eine faire, überprüfbare Arbeitsverdichtung für pädagogische Praxis. Personenprofile sind dabei nur zusammen mit Gegenbelegen, Revision und Konstellationsbezug zulässig. Das System ist primär für pädagogische Kontexte wie Jugendhilfe, Wohngruppen und Schulsozialarbeit konzipiert und grundsätzlich auf andere Settings mit wiederkehrenden Spannungsdynamiken übertragbar.

Das kanonische Produktdokument für dieses Repository liegt in [`MASTERPLAN.md`](./MASTERPLAN.md).

Eine geordnete Übersicht aller Dokumente findet sich im [Dokumentationsindex](./docs/index.md).

## Was Spannungsatlas nicht ist

- **Kein Diagnosetool** — es erzeugt keine klinischen oder psychiatrischen Diagnosen
- **Kein Bewertungssystem** — Profile sind revidierbare Arbeitsprofile, keine Urteile über Personen
- **Kein Wahrheitsautomat** — Deutungen bleiben als vorläufige Denkstände markiert; Unsicherheit ist kein Fehler, sondern ein Pflichtfeld
- **Kein Entscheidungssystem für Ad-hoc-Situationen** — das System dient primär der nachträglichen Reflexion und Dokumentation, nicht der schnellen automatisierten Situationsentscheidung.

Stattdessen: ein Reflexions- und Dokumentationssystem mit sichtbarer Unsicherheit, Pflicht zur Gegen-Deutung und revisionsfähiger Arbeitsverdichtung.

## Kernprinzipien

- Beobachtung und Deutung werden strikt getrennt dokumentiert
- Gegen-Deutung ist Pflicht, keine Option
- Unsicherheit bleibt sichtbar — Datenlücken und offene Fragen sind kein Mangel
- Profile sind revidierbare Arbeitsprofile, keine stabilen Wesensbeschreibungen
- Profile bleiben kontextgebunden und revidierbar.

## Minimaler Arbeitsablauf

Der aktuelle Systemstand unterstützt folgenden Ablauf:

1. **Fall anlegen** — Kontext und beteiligte Person erfassen
2. **Beobachtung dokumentieren** — rein beschreibend, kameraähnlich
3. **Deutung formulieren** — Hypothese mit Evidenztyp (beobachtungsnah / abgeleitet / spekulativ)
4. **Gegen-Deutung formulieren** — alternative Erklärung zur selben Beobachtung
5. **Unsicherheit begründen** — Datenlücken, offene Fragen, Begrenzungen der Einschätzung
6. **Fallansicht prüfen** — erfasste Elemente in der Fallübersicht kontrollieren

## Architektur auf einen Blick

| Schicht | Inhalt |
|---------|--------|
| `src/domain/` | Produktkern: Typen, Guards, Factories, epistemische Regeln |
| `apps/web/` | SvelteKit-Webschicht mit Vercel-Adapter |
| Persistenz | Local-first via `localStorage` (Schlüssel: `spannungsatlas-cases`) |

Noch nicht implementiert: zentrale Persistenz, API, Authentifizierung, Rollen-/Rechtelogik, Export, Auditierbarkeit (vorgesehen für spätere Phasen laut [`docs/deploy-blaupause.md`](./docs/deploy-blaupause.md)).

## Aktueller Implementationsstand

Implementiert ist der **Phase-1-Reflexionskern**: Domain-Typen sowie zugehörige Guards und Factories in `src/domain/` (siehe [`src/domain/types.ts`](./src/domain/types.ts)).

Implementiert ist die **Phase-0/1-Webschicht**: Eine SvelteKit-Anwendung unter [`apps/web/`](./apps/web/) mit Vercel-Adapter. Die Web-App ermöglicht das Anlegen, Anzeigen und lokale Speichern von Reflexionsfällen. Sie konsumiert den Domain-Kern aus `src/domain/` und arbeitet local-first (localStorage). Routen: Dashboard (`/`), Neuer Fall (`/cases/new`), Fallansicht (`/cases/[id]`), Katalog-Platzhalter (`/catalog`), Vergleich-Platzhalter (`/compare`).

Noch nicht implementiert ist der **Phase-2-Explorationsraum**: Bedürfnis- und Determinantenkatalog, Clusterstruktur, Selektionsfelder und UI-Schichten. Das Zieldatenmodell dafür ist in [`docs/ux-ui-blaupause.md §7`](./docs/ux-ui-blaupause.md) beschrieben.

Noch nicht implementiert: zentrale Persistenz, API, Authentifizierung, Rollen-/Rechtelogik, Export und Auditierbarkeit (Phase 2+ laut [`docs/deploy-blaupause.md`](./docs/deploy-blaupause.md)).

## Entwicklung und Verifikation

Voraussetzung: Node.js ≥ 20.19 (siehe `.nvmrc`).

```bash
npm install          # Abhängigkeiten installieren (Root + apps/web)
npm run typecheck    # Domain-Typecheck (tsc --noEmit)
npm run test         # Domain-Tests (vitest)
npm run check:web    # SvelteKit-Typecheck (svelte-check)
npm run build:web    # Web-App bauen (Vite + Vercel-Adapter)
npm run verify       # Gesamtprüfung: typecheck → test → check:web → build:web
npm run dev          # Lokaler Entwicklungsserver (SvelteKit)
```

## Dokumentationsverweise

- [`MASTERPLAN.md`](./MASTERPLAN.md) — Kanonisches Produktdokument
- [`docs/roadmap.md`](./docs/roadmap.md) — Ausbauplan nach Phase 0/1
- [`docs/ux-ui-blaupause.md`](./docs/ux-ui-blaupause.md) — UX/UI-Konzept
- [`docs/deploy-blaupause.md`](./docs/deploy-blaupause.md) — Architektur und Deploy-Strategie
- [`docs/index.md`](./docs/index.md) — Dokumentationsübersicht
