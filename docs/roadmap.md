---
id: roadmap
title: "Spannungsatlas – Ausbauplan nach Phase 0/1"
doc_type: roadmap
status: active
canonicality: informational
summary: "Geordneter Ausbaupfad nach der initialen Webschicht, orientiert am bestehenden Produktkanon."
related_docs:
  - masterplan
  - ux-ui-blaupause
  - deploy-blaupause
last_reviewed: "2026-03-29"
---

# Spannungsatlas – Ausbauplan nach Phase 0/1

> **Hinweis:** Dieses Dokument ist informational. Es fasst den nächsten Ausbaupfad zusammen, ohne neue Produktregeln zu setzen. Bei Konflikten gilt der kanonische Produktmasterplan in `MASTERPLAN.md`.

## 1. Zweck des Ausbauplans

Mit Phase 0/1 sind ein lauffähiger Domain-Kern und eine erste Webschicht vorhanden. Die nächsten Schritte müssen priorisiert werden, um den Produktcharakter des Systems zu erhalten und schrittweise auszubauen. Dieser Plan beschreibt die empfohlene Reihenfolge — ohne die bereits definierten Produktregeln zu erweitern oder zu verändern.

## 2. Leitregel

Bevor neue Schichten gebaut werden, sollte der bestehende Reflexionskern in der UI so ausgestaltet werden, dass epistemische Disziplin — also die klare Trennung von Beobachtung, Deutung, Gegen-Deutung und Unsicherheit — im Arbeitsfluss stabil erfahrbar ist.

## 3. Empfohlene Reihenfolge

### Phase 2a — Reflexionskern in der UI stabilisieren

- Gegen-Deutung und Unsicherheitsbegründung im Fallfluss prominent verankern.
- Revisionsfähigkeit sichtbar machen (Revisionshistorie, Änderungsgründe).
- Fallansicht so gestalten, dass epistemische Trennung visuell klar wird.

### Phase 2b — Explorationsraum

- Bedürfnis- und Determinantenkatalog bereitstellen (gemäß [`docs/ux-ui-blaupause.md §7`](./ux-ui-blaupause.md)).
- Clusterstruktur und Selektionsfelder umsetzen.
- Katalog als Reflexionswerkzeug einbinden, nicht als automatische Deutungsmaschine.

### Phase 3 — Vergleich und Drift

- Vergleichsansichten zwischen Revisionen und Fällen ermöglichen.
- Drift über Zeit sichtbar machen.
- Darstellung als Reflexionsinstrument, nicht als Bewertung.

### Phase 4 — Spannungsnetz und Verdichtung

- Konstellationsprofile und Spannungsnetze implementieren.
- Konstellationsanalyse dient gemäß Masterplan als notwendiges Gegengewicht gegen vorschnelle Wesenserklärung einzelner Personen.
- Verdichtung explizit als Arbeitsverdichtung kennzeichnen, nicht als Wahrheitsurteil.

## 4. Typische Fehlannahmen

- **„Die Webschicht ist der Produktkern."** — Die Webschicht ist Konsumentin des Domain-Kerns, nicht dessen Ersatz.
- **„Der Katalog liefert automatische Deutungen."** — Der Katalog ist ein Reflexionswerkzeug; er schlägt keine Deutungen vor und setzt keine voraus.
- **„Vergleich ist Bewertung."** — Vergleiche dienen der Reflexion, nicht der Rangordnung oder Beurteilung.
- **„Phase 4 ist dekorativ."** — Konstellationsanalyse ist gemäß Masterplan Pflichtgegengewicht, nicht beliebig optional.

## 5. Offene infrastrukturelle Themen

Folgende Themen sind für den späteren Betrieb relevant, aber in der aktuellen Phase bewusst noch nicht umgesetzt:

- Zentrale Persistenz (Ablösung von localStorage)
- Rollen- und Rechtelogik
- Audit und Exportkontrolle
- Mehrnutzerfähigkeit

Diese Punkte werden nicht still vorausgesetzt oder suggeriert.
