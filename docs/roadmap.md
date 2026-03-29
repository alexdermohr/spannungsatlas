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

> **Hinweis:** Dieses Dokument ist informell. Verbindliche Produktanforderungen liegen in `MASTERPLAN.md`. Dieser Plan verdichtet den Ausbaupfad aus vorhandenem Kanon, erfindet keine neuen Produktbehauptungen.

## 1. Zweck des Ausbauplans

Nach der implementierten Phase-0/1-Webschicht — Domain-Kern, SvelteKit-Anwendung, local-first Persistenz — dient dieser Plan der Priorisierung der nächsten Ausbauschritte. Er hält fest, was als nächstes sinnvoll wäre, ohne den aktuellen Stand als mehr darzustellen als er ist.

## 2. Leitregel

**Erst epistemische Disziplin stabilisieren, dann Explorations- und Vergleichsräume ausbauen.**

Das bedeutet: Bevor neue Schichten gebaut werden, sollte Beobachtung, Deutung, Gegen-Deutung und Unsicherheit in der bestehenden Webschicht so ausgestaltet werden, dass sie dem Anspruch des MASTERPLAN.md in der Praxis standhalten.

## 3. Empfohlene Reihenfolge

### Phase 2a — Reflexionskern in der UI stabilisieren

Ziel: Die epistemische Disziplin des Produktkerns in der Webschicht erkennbar und prüfbar machen.

- Beobachtung, Deutung, Gegen-Deutung und Unsicherheit als klar unterscheidbare Felder absichern
- Evidenztyp-Auswahl (beobachtungsnah / abgeleitet / spekulativ) in der Fall-Erfassung verankern
- Fallansicht so gestalten, dass Trennungen auf einen Blick sichtbar sind
- Quick-Capture-Modus und Tiefenreflexions-Modus unterscheidbar machen (gemäß MASTERPLAN.md §7.1)

### Phase 2b — Explorationsraum

Ziel: Strukturierter Zugang zu Bedürfnissen, Determinanten und Konstellationshinweisen.

- Bedürfnis- und Determinantenkatalog (gemäß UX/UI-Blaupause §6–7)
- Clusterstruktur für Auswahl und Zuordnung
- Selektionsfelder für Auslöser, Umweltreaktionen, Interventionen
- Konstellationsbezug in Fällen als strukturiertes Feld, nicht nur als Freitext

### Phase 3 — Vergleich und Drift

Ziel: Deutungsveränderungen über Zeit sichtbar und klassifizierbar machen.

- Mehrere Denkstände zur selben Person nebeneinander vergleichen
- Drift-Klassifikation sichtbar machen: durch neue Beobachtung, neue Perspektive oder Neubewertung gleicher Daten entstanden (gemäß MASTERPLAN.md §2 Invariante 21)
- Einfacher Verlauf je Person mit dokumentierten Revisionen

### Phase 4 — Spannungsnetz und Verdichtung

Ziel: Relationale Sicht und kontrollierte Profilverdichtung.

- Spannungsprofil-Workflow mit Evidenzstufen, Gegenbelegen und Revisionsdatum (gemäß MASTERPLAN.md §3.2)
- Konstellationsprofil als eigenständiges Objekt mit eigener Verdichtungslogik (gemäß MASTERPLAN.md §3.3)
- Relationale Ansicht: Wechselwirkungen zwischen Profilen sichtbar machen
- Vorbereitung auf spätere Konstellationsarbeit (MASTERPLAN.md §3.4)

## 4. Typische Fehlannahmen

- **„Die Webschicht ist der Produktkern"** — Die Webschicht ist Konsumentin des Produktkerns. Guards, Factories und Typen in `src/domain/` bilden die epistemischen Regeln; die Webschicht macht sie klickbar.
- **„Katalog = automatische Deutung"** — Bedürfnis- und Determinantenkataloge liefern Vokabular zur Auswahl, keine Deutungsautomatik. Deutungen bleiben Pflicht des Nutzers.
- **„Vergleich = Bewertung"** — Der Vergleich von Denkständen dient der Reflexion, nicht der Bewertung von Personen oder der Erzeugung von Scores.
- **„Phase 4 ist optional"** — Die Konstellationsanalyse ist Pflichtgegengewicht zur Profilverdichtung (MASTERPLAN.md §4). Sie dient gemäß Masterplan als notwendiges Gegengewicht.

## 5. Klare Abgrenzung

Folgendes ist in keiner der oben genannten Phasen enthalten und bleibt explizit offen:

- **Zentrale Persistenz** — local-first ist der aktuelle Stand; zentralisierte Datenhaltung ist für spätere Phasen vorgesehen (deploy-blaupause §4 Phase 2)
- **Rollen und Rechte** — das Berechtigungsmodell (MASTERPLAN.md §8) ist konzeptionell beschrieben, aber nicht implementiert
- **Audit und Exportkontrolle** — keine der aktuellen Phasen implementiert Audit-Trails oder kontrollierte Exportfunktionen
- **Mehrnutzerfähigkeit** — der aktuelle Stand ist single-user / local-first; Teamnutzung setzt zentrale Infrastruktur voraus

Diese Punkte werden in keiner der oben genannten Phasen still vorausgesetzt oder suggeriert.
