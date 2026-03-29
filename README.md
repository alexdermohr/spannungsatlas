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
last_reviewed: "2026-03-29"
---

# Spannungsatlas

Spannungsatlas ist ein pädagogisches Dokumentations-, Reflexions- und Vordiagnostiksystem. Es verbindet Fallarbeit, revidierbare Spannungsprofile von Personen und Konstellationsanalyse von Situationen im Zeitverlauf. Spätere Ausbaustufen können zusätzlich reduzierte Spannungskonstellationen als systemischen Zusatzlayer ergänzen. Der Kern ist nicht Diagnose, sondern eine faire, überprüfbare Arbeitsverdichtung für pädagogische Praxis. Personenprofile sind dabei nur zusammen mit Gegenbelegen, Revision und Konstellationsbezug zulässig. Das System ist primär für pädagogische Kontexte wie Jugendhilfe, Wohngruppen und Schulsozialarbeit konzipiert und grundsätzlich auf andere Settings mit wiederkehrenden Spannungsdynamiken übertragbar.

Das kanonische Produktdokument für dieses Repository liegt in [`MASTERPLAN.md`](./MASTERPLAN.md).

Eine geordnete Übersicht aller Dokumente findet sich im [Dokumentationsindex](./docs/index.md).

## Aktueller Implementationsstand

Implementiert ist der **Phase-1-Reflexionskern**: Domain-Typen sowie zugehörige Guards und Factories in `src/domain/` (siehe [`src/domain/types.ts`](./src/domain/types.ts)).

Implementiert ist die **Phase-0/1-Webschicht**: Eine SvelteKit-Anwendung unter [`apps/web/`](./apps/web/) mit Vercel-Adapter. Die Web-App ermöglicht das Anlegen, Anzeigen und lokale Speichern von Reflexionsfällen. Sie konsumiert den Domain-Kern aus `src/domain/` und arbeitet local-first (localStorage). Routen: Dashboard (`/`), Neuer Fall (`/cases/new`), Fallansicht (`/cases/[id]`), Katalog-Platzhalter (`/catalog`), Vergleich-Platzhalter (`/compare`).

Noch nicht implementiert ist der **Phase-2-Explorationsraum**: Bedürfnis- und Determinantenkatalog, Clusterstruktur, Selektionsfelder und UI-Schichten. Das Zieldatenmodell dafür ist in [`docs/ux-ui-blaupause.md §7`](./docs/ux-ui-blaupause.md) beschrieben.

Noch nicht implementiert: zentrale Persistenz, API, Authentifizierung, Rollen-/Rechtelogik, Export und Auditierbarkeit (Phase 2+ laut [`docs/deploy-blaupause.md`](./docs/deploy-blaupause.md)).
