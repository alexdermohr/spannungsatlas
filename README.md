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
last_reviewed: "2026-06-29"
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
- **Phase-0/1-Webschicht** ist implementiert: SvelteKit-Anwendung unter `apps/web/` mit Vercel-Adapter, local-first (localStorage). Routen: Dashboard, Neuer Fall, Fallansicht, Personenübersicht, Katalog, Vergleich-Platzhalter.
- **Phase-2a-Perspektiven** (Blinddokumentation, „Modus A – streng blind") ist implementiert: pro Fall können getrennte `PerspectiveRecord`-Artefakte erstellt und committet werden. Fremde Perspektiven bleiben in dieser Phase unsichtbar; der Vergleich ist domänenseitig deaktiviert.
- **Phase-2b-Explorationsraum** ist implementiert: Bedürfnis- und Determinantenkatalog mit Clusterstruktur (`/catalog`), Selektionsfelder pro Perspektive sowie ein nachgelagerter Explorationsraum nach Commit.
- **Personenübersicht** (`/people`) aggregiert Fälle pro beteiligter Person als Navigationshilfe — keine Verdichtung, kein Spannungsprofil. Die Personendetailseite (`/people/[id]`) zeigt die Fallbasis und enthält zusätzlich die erste manuelle Spannungsprofil-Oberfläche.
- **Spannungsprofil-Schutzlogik** (Domänenkern, `src/domain/tension-profile.ts`) ist implementiert: die Verdichtungs- und Evidenzschwellen nach [MASTERPLAN §3.2](./MASTERPLAN.md) (Mindestfallzahl, Evidenzstufen schwach/moderat/stark, Gegenbeleg-Pflicht bei starken Einträgen, epistemische Markierung nach §10.2, Revisionsdatum, 180-Tage-Verfall) als geprüfte Domänenlogik — ein Schutzmechanismus gegen vorschnelle Verdichtung, der ein **formuliertes** Profil prüft, keine automatische Deutung. Eine erste local-first Oberfläche zur Formulierung und Anzeige von Spannungsprofilen ist auf der Personenseite (`/people/[id]`) umgesetzt; Rollen-/Freigabe-Workflow, zentrale Persistenz und Profilhistorie bleiben weiterhin offen.
- **Phase 3 (Vergleich und Drift)** ist noch nicht freigegeben: solange die Perspektiven-Phase auf `phase-1-strict-blind` steht, bleibt der Vergleichsraum bewusst inaktiv.

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
