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

Spannungsatlas ist ein pädagogisches Dokumentations- und Reflexionssystem mit strukturierter Hypothesenbildung. Es verbindet Fallarbeit, revidierbare Spannungsprofile von Personen und Konstellationsanalyse von Situationen im Zeitverlauf. Der Kern ist eine faire, überprüfbare Arbeitsverdichtung für pädagogische Praxis — keine Diagnose. Personenprofile sind dabei nur zusammen mit Gegenbelegen, Revision und Konstellationsbezug zulässig. Das System ist primär für pädagogische Kontexte wie Jugendhilfe, Wohngruppen und Schulsozialarbeit konzipiert und grundsätzlich auf andere Settings mit wiederkehrenden Spannungsdynamiken übertragbar.

Das kanonische Produktdokument für dieses Repository liegt in [`MASTERPLAN.md`](./MASTERPLAN.md).

Eine geordnete Übersicht aller Dokumente findet sich im [Dokumentationsindex](./docs/index.md).

## Was Spannungsatlas nicht ist

- **Kein Diagnosetool.** Spannungsatlas ersetzt keine klinische oder therapeutische Diagnostik.
- **Kein Bewertungssystem.** Es bewertet weder Personen noch Situationen.
- **Kein Wahrheitsautomat.** Alle Profile und Deutungen sind revidierbar, nicht endgültig.
- **Kein System für schnelle Situationsentscheidungen.** Das System dient primär der nachträglichen Reflexion und Dokumentation, nicht der automatisierten Entscheidung in Akutsituationen.

## Kernprinzipien

- Beobachtung und Deutung werden getrennt dokumentiert.
- Gegen-Deutungen sind Pflicht.
- Unsicherheiten bleiben sichtbar.
- Profile sind kontextgebundene, revidierbare Arbeitsprofile.

## Minimaler Arbeitsablauf

1. **Fall anlegen** — Kontext und beteiligte Personen erfassen.
2. **Beobachtung dokumentieren** — beschreibend, möglichst kameraähnlich.
3. **Deutung formulieren** — Hypothese mit markierter Evidenznähe.
4. **Gegen-Deutungen formulieren** — alternative Lesarten derselben Beobachtung (mindestens eine).
5. **Unsicherheiten begründen** — Datenlücken, offene Fragen, Begrenzungen benennen (mindestens eine).
6. **Fallansicht prüfen** — Trennung der Elemente und Gesamtbild kontrollieren.

## Architektur auf einen Blick

| Bereich | Ort | Beschreibung |
|---------|-----|-------------|
| Domain-Kern | `src/domain/` | Typen, Guards, Factories — produktlogischer Kern |
| Web-App | `apps/web/` | SvelteKit-Oberfläche mit Vercel-Adapter |
| Persistenz | `localStorage` | Local-first, browserseitig |

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
