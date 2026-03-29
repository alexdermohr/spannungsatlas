---
id: readme
title: "Spannungsatlas"
doc_type: readme
status: active
canonicality: informational
summary: "Repo-Einstieg mit Kurzbeschreibung und Verweis auf das kanonische Produktdokument."
related_docs:
  - masterplan
last_reviewed: "2026-03-29"
---

# Spannungsatlas

Spannungsatlas ist ein pädagogisches Dokumentations-, Reflexions- und Vordiagnostiksystem. Es verbindet Fallarbeit, revidierbare Spannungsprofile von Personen und Konstellationsanalyse von Situationen im Zeitverlauf. Spätere Ausbaustufen können zusätzlich reduzierte Spannungskonstellationen als systemischen Zusatzlayer ergänzen. Der Kern ist nicht Diagnose, sondern eine faire, überprüfbare Arbeitsverdichtung für pädagogische Praxis. Personenprofile sind dabei nur zusammen mit Gegenbelegen, Revision und Konstellationsbezug zulässig. Das System ist primär für pädagogische Kontexte wie Jugendhilfe, Wohngruppen und Schulsozialarbeit konzipiert und grundsätzlich auf andere Settings mit wiederkehrenden Spannungsdynamiken übertragbar.

Das kanonische Produktdokument für dieses Repository liegt in [`MASTERPLAN.md`](./MASTERPLAN.md).

Eine geordnete Übersicht aller Dokumente findet sich im [Dokumentationsindex](./docs/index.md).

## Aktueller Implementationsstand

**Implementiert – Phase 1 / Reflexionskern:**

- Domain-Typen (`src/domain/types.ts`): `Case`, `ReflectionSnapshot`, `Observation`, `Interpretation`, `Uncertainty`, `TensionEdge`, `Revision`, `CaseParticipant` sowie alle Enum-Typen (`EvidenceType`, `DriftType`, `UncertaintyLevel`, `TensionDirection`, `ParticipantRole`)
- Guards (`src/domain/guards.ts`): strukturelle Validierung aller Kerntypen
- Factories (`src/domain/factories.ts`): typsichere Konstruktorfunktionen für alle Kernobjekte
- Tests (`tests/domain/`): Vollabdeckung von Guards und Factories

**Noch nicht implementiert – Phase 2 / Explorationsraum:**

- `Need`, `Determinant`, `NeedSelection`, `DeterminantSelection` (Bedürfnis- und Determinantenkatalog)
- `selectedNeeds` und `selectedDeterminants` sind bewusst nicht Teil von `ReflectionSnapshot` im aktuellen Code; diese Felder gehören zur Explorationsebene (UX-Blaupause §2 „Ebene A", §8 Phase 2)
- Bedürfnis-Cluster, Determinantenwahl, visuelle Markierung
- UI-Schichten (case-editor, need-catalog, tension-graph u. a.)

Diese Abgrenzung ist beabsichtigt. Das Ziel-Datenmodell in `docs/ux-ui-blaupause.md §7` beschreibt den vollständigen Mehrphasenzustand; der aktuelle Code implementiert davon den Phase-1-Kern.
