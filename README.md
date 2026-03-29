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

Spannungsatlas ist ein pädagogisches Dokumentations-, Reflexions- und Vordiagnostiksystem. Es verbindet Fallarbeit, revidierbare Spannungsprofile von Personen und Konstellationsanalyse von Situationen im Zeitverlauf. Der Kern ist nicht Diagnose, sondern eine faire, überprüfbare Arbeitsverdichtung für pädagogische Praxis. Personenprofile sind dabei nur zusammen mit Gegenbelegen, Revision und Konstellationsbezug zulässig. Das System ist primär für pädagogische Kontexte wie Jugendhilfe, Wohngruppen und Schulsozialarbeit konzipiert und grundsätzlich auf andere Settings mit wiederkehrenden Spannungsdynamiken übertragbar.

Das kanonische Produktdokument für dieses Repository liegt in [`MASTERPLAN.md`](./MASTERPLAN.md).

Eine geordnete Übersicht aller Dokumente findet sich im [Dokumentationsindex](./docs/index.md).

## Was Spannungsatlas nicht ist

- **Kein Diagnosetool.** Spannungsatlas ersetzt keine klinische oder therapeutische Diagnostik.
- **Kein Bewertungssystem.** Es bewertet weder Personen noch Situationen.
- **Kein Wahrheitsautomat.** Alle Profile und Deutungen sind revidierbar, nicht endgültig.
- **Kein System für schnelle Situationsentscheidungen.** Das System dient primär der nachträglichen Reflexion und Dokumentation, nicht der schnellen automatisierten Situationsentscheidung.

## Kernprinzipien

- Beobachtung und Deutung werden getrennt dokumentiert.
- Gegen-Deutung ist Pflicht.
- Unsicherheit bleibt sichtbar.
- Profile sind revidierbare Arbeitsprofile.
- Profile bleiben kontextgebunden und revidierbar.

## Minimaler Arbeitsablauf

1. **Fall anlegen** — Kontext und beteiligte Person erfassen.
2. **Beobachtung dokumentieren** — Was wurde wahrgenommen?
3. **Deutung formulieren** — Welche Hypothese ergibt sich?
4. **Gegen-Deutung formulieren** — Welche alternative Lesart ist denkbar?
5. **Unsicherheit begründen** — Was bleibt offen?
6. **Fallansicht prüfen** — Gesamtbild des Falls betrachten.

## Architektur auf einen Blick

| Bereich | Ort | Beschreibung |
|---------|-----|-------------|
| Domain-Kern | `src/domain/` | Typen, Guards, Factories — produktlogischer Kern |
| Web-App | `apps/web/` | SvelteKit-Oberfläche mit Vercel-Adapter |
| Persistenz | localStorage | Local-first, browserseitig |

Noch **nicht** implementiert: zentrale Persistenz, API, Authentifizierung, Rollen-/Rechtelogik, Export und Auditierbarkeit.

## Aktueller Implementationsstand

- **Phase-1-Reflexionskern** ist implementiert: Domain-Typen, Guards und Factories in `src/domain/`.
- **Phase-0/1-Webschicht** ist implementiert: SvelteKit-Anwendung unter `apps/web/` mit Vercel-Adapter, local-first (localStorage). Routen: Dashboard, Neuer Fall, Fallansicht, Katalog-Platzhalter, Vergleich-Platzhalter.
- **Phase-2-Explorationsraum** ist noch nicht implementiert: Bedürfnis- und Determinantenkatalog, Clusterstruktur, Selektionsfelder und UI-Schichten. Das Zieldatenmodell ist in [`docs/ux-ui-blaupause.md §7`](./docs/ux-ui-blaupause.md) beschrieben.

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

| Dokument | Beschreibung |
|----------|-------------|
| [MASTERPLAN.md](./MASTERPLAN.md) | Kanonisches Produktdokument |
| [docs/roadmap.md](./docs/roadmap.md) | Ausbauplan nach Phase 0/1 |
| [docs/ux-ui-blaupause.md](./docs/ux-ui-blaupause.md) | UX/UI-Konzept |
| [docs/deploy-blaupause.md](./docs/deploy-blaupause.md) | Deploy-Architektur |
| [docs/index.md](./docs/index.md) | Dokumentationsübersicht |
