---
id: deploy-blaupause
title: "Spannungsatlas – Deploy-Blaupause mit Vercel"
doc_type: architecture
status: active
canonicality: canonical
summary: "Architektur-Blaupause: Vercel für UI, Preview und Iteration; Produktkern entkoppelt halten."
related_docs:
  - masterplan
  - ux-ui-blaupause
last_reviewed: "2026-03-29"
---

> **Hinweis:** Dieses Dokument definiert die Deploy-Strategie und Architektur. Bei Konflikten gilt der kanonische Produktmasterplan in `MASTERPLAN.md`.

# Spannungsatlas – Deploy-Blaupause mit Vercel

## 1. Zielbild

Spannungsatlas wird in einer Weise aufgebaut, die zwei Anforderungen zugleich erfüllt:
1. **maximal bequeme Iteration** für UI, Flow, Vorschau und Review
2. **saubere spätere Trennung** für Rollen, Rechte, Revision, Export und sensible Daten

Die Blaupause folgt damit dem Produktcharakter des Systems: Spannungsatlas ist kein bloßes Formular, sondern ein Dokumentations-, Reflexions- und Vordiagnostiksystem mit expliziter Trennung von Beobachtung, Deutung, Gegen-Deutung und Unsicherheit. Zugleich sieht die UX-Blaupause für V1 einen local-first-Ansatz und für spätere Ausbaustufen Postgres + API vor.

---

## 2. Grundprinzip

**Vercel ist die richtige Schicht für Komfort.**
**Die Produktwahrheit darf später nicht an diesen Komfort geklebt sein.**

Daraus folgt:
- Frontend / UI / Preview / Demo → Vercel
- Domäne / Regeln / Schutzmechanismen → repo-interne Kernlogik
- spätere Persistenz / Rechte / Audit / Export → getrennte Kernschicht

---

## 3. Architekturprinzip

### Schicht A — Weboberfläche
**Ziel:** schnelle Entwicklung, PR-Previews, Demo, Stakeholder-Feedback
**Ort:** Vercel

**Enthält:**
- Dashboard
- Fall-Erfassungsfluss
- Beobachtungs- und Deutungsoberflächen
- Gegen-Deutungs- und Unsicherheits-UI
- Spannungsnetz-Ansichten
- Vergleichs- und Drift-Ansichten
- ICF-Import-Oberfläche

**Leitidee:** Diese Schicht macht den Spannungsatlas klickbar.

### Schicht B — Produktkern
**Ziel:** semantische Stabilität und Regelklarheit
**Ort:** im Kern des Repos, später auch als eigenständige Server-/API-Schicht nutzbar

**Enthält:**
- Domain-Typen
- Guards
- Factories
- epistemische Regeln
- Konsistenzprüfungen
- Trennung von Beobachtung, Deutung, Gegen-Deutung und Unsicherheit

### Schicht C — spätere Produktinfrastruktur
**Ziel:** echte Mehrnutzerfähigkeit und kontrollierter Betrieb

**Später enthalten:**
- zentrale Persistenz
- Rollen- und Berechtigungslogik
- Revisionshistorie
- Profilfreigabe
- Exportkontrolle
- Auditierbarkeit

*Diese Schicht wird nicht in der ersten Deploy-Phase vorausgesetzt.*

---

## 4. Phasenmodell

### Phase 0 — Vercel-fähiges Grundgerüst
Ziel ist, das Repo in eine Form zu bringen, in der eine echte Weboberfläche deploybar wird.

**Ergebnis:**
- Web-App-Struktur vorhanden
- Framework gewählt (SvelteKit + TypeScript)
- Build-Pfad klar
- Vercel-Anbindung möglich

### Phase 1 — Vercel als Preview- und Demo-Schicht
In dieser Phase wird Spannungsatlas als interaktiver Frontend-Prototyp betrieben.

**Zweck:** UX testen, Denkfluss sichtbar machen, PR-Previews nutzen, Screens und Komponenten validieren.
**Datenmodus:** lokale Persistenz, Mockdaten, Demo-Datensätze (keine sensiblen Daten).

### Phase 2 — Auskopplung des Produktkerns
Sobald echte Persistenz, Rechte und Teamnutzung relevant werden, wird der Produktkern infrastrukturell getrennt.

**Dann gilt:**
- Frontend bleibt auf Vercel
- App-Kern wird als eigene API oder kontrollierte Logikschicht betrieben
- Datenhaltung wird zentralisiert

---

## 5. Technisches Zielbild (Repo-Struktur)

Dies ist eine Zielstruktur für Phase 0/1. Sie beschreibt den angestrebten Zustand und ist im aktuellen Repository noch nicht umgesetzt.


```
spannungsatlas/
  apps/
    web/         # Vercel-Schicht (SvelteKit UI)
  src/
    domain/      # produktlogischer Kern
  docs/          # kanonische Produkt-, UX- und Integrationsgrundlagen
  contracts/     # spätere strukturelle und fachliche Kontrakte
  tests/         # Absicherung des Kerns
```

**Vorteil:** Die Weboberfläche wird dadurch Konsumentin der Produktlogik, nicht deren Ersatz.

---

## 6. Funktionale MVP-Zielstruktur

Erste Screens: Dashboard, Neuer Fall, Fallansicht, Bedürfnis-/Determinantenraum, Personenseite, Vergleich / Drift.
Erste Kernkomponenten: CaseEditor, ObservationEditor, InterpretationEditor, CounterInterpretationEditor, UncertaintyEditor, NeedCatalog, TensionGraph, RevisionTimeline, ExternalAssessmentImportWizard.

---

## 7. Vercel-Rolle in dieser Blaupause

**Zuständig für:**
- automatische Deployments
- Preview-Deploys pro Branch / PR
- schnelles UI-Feedback
- Demo-Betrieb

**Zunächst NICHT zuständig für:**
- endgültige Produktdatenhaltung
- sensible Mehrnutzerlogik
- zentrale Rechteprüfung als alleinige Instanz
- endgültige Export- und Auditarchitektur

---

## 8. Leitregel

> **Was den Denkfluss zeigt, darf schnell deployen. Was Menschen verdichtet, muss später kontrolliert betrieben werden.**

---

## 9. Typische Fehlannahmen

1. „Wenn Vercel bequem ist, sollte alles dort leben.“ → Vercel ist ideal als Frontend- und Preview-Maschine, aber nicht zwingend für die endgültige Produktwahrheit.
2. „Wenn V1 local-first ist, braucht man gar keine Webschicht.“ → Local-first beschreibt die Datenstrategie, verbietet aber keine deployte Oberfläche.

---

## 10. Entscheidung

- Weboberfläche auf Vercel
- Produktkern repo-intern sauber halten
- Spätere API- und Datenhaltung vorbereiten, aber noch nicht erzwingen
- Phase 1 als klickbarer epistemischer Prototyp, Phase 2 als echte kontrollierte Anwendung
