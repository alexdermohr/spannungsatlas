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

Diese Struktur ist seit Phase 0/1 im Repository umgesetzt. `apps/web` enthält eine SvelteKit-Anwendung mit Vercel-Adapter, die den Domain-Kern aus `src/domain` konsumiert.


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

---

## 11. Versionierung, PWA-Basis und Update-Flow

### 11.1 Ziel

Neue Deployments sollen nicht unsichtbar im Browser-Cache hängen bleiben.
Nutzer bekommen einen kontrollierten, dezenten Hinweis, wenn eine neue Version bereitsteht.

### 11.2 Build-Version und version.json

Bei jedem Build (und im Dev-Modus) wird automatisch `apps/web/static/version.json` erzeugt:

```json
{
  "release": "0.1.0",
  "build": "abc1234",
  "commit": "abc1234",
  "builtAt": "2026-03-30T18:00:00.000Z"
}
```

Die Datei wird vom Vite-Plugin in `apps/web/vite.config.ts` beim Build-Start geschrieben.
Gleichzeitig wird `__APP_VERSION__` als globale Konstante in den App-Code eingebettet.

**Invariante:** `version.json` ist die einzige laufzeitfähige Wahrheitsquelle für die Build-Identität.

### 11.3 Service Worker und Cache-Strategie

Der Service Worker liegt unter `apps/web/src/service-worker.ts` und wird von SvelteKit
automatisch registriert und verarbeitet.

| Ressourcentyp | Strategie |
|---|---|
| HTML / Navigation | Network-first (Offline-Fallback auf Cache) |
| Vite-gehashte Assets (`/_app/immutable/…`) | Cache-first (stabil, inhaltsgehashed) |
| `version.json` | Immer Netzwerk, nie gecacht |
| Alles andere | Stale-while-revalidate |

**Cache-Name:** Enthält die SvelteKit-Build-Version (`app-${version}`).
Bei jedem neuen Build werden alle alten Caches beim Aktivieren des neuen SW gelöscht.

**Update-Aktivierung:** Der neue Service Worker übernimmt nicht automatisch.
Der Nutzer steuert das über den Update-Banner (siehe unten).

### 11.4 Clientseitige Update-Erkennung

`UpdateBanner.svelte` (eingebunden in `+layout.svelte`) prüft alle 5 Minuten
und bei Tab-Fokus, ob `version.json` am Server eine neuere `build`-ID hat.

Falls ja: dezenter Banner unten rechts mit „Neue Version verfügbar – Jetzt aktualisieren".
Klick → sendet `SKIP_WAITING` an wartenden Service Worker → Seite lädt neu.

Der Banner funktioniert auch ohne aktiven Service Worker (dann nur Plain-Reload).

### 11.5 PWA-Basis

- Manifest: `apps/web/static/manifest.webmanifest`
- Theme-Color: `#2d5a9b` (App-Akzentfarbe)
- Icon: `apps/web/static/icons/icon.svg` (SVG-Platzhalter – für vollständige Browser-Unterstützung
  sollten PNG-Icons in 192×192 und 512×512 ergänzt werden)

### 11.6 Cache-Control-Header auf Vercel

Konfiguriert in `vercel.json`:

| Pfad | Cache-Control |
|---|---|
| `/version.json` | `no-store, max-age=0` |
| `/service-worker.js` | `no-store, max-age=0` |
| `/_app/immutable/…` | `public, max-age=31536000, immutable` |

HTML-Responses werden von der SvelteKit-Vercel-Adapter-Integration verwaltet
und sind standardmäßig revalidierbar.

### 11.7 Lokale Verifikation

```bash
# 1. Build
npm run build:web

# 2. Prüfen, dass version.json erzeugt wurde
cat apps/web/static/version.json

# 3. Lokaler Vorschau-Server (simuliert Produktionsbuild)
npm run preview --workspace=apps/web

# 4. Im Browser prüfen:
#    - DevTools → Application → Manifest: Manifest geladen?
#    - DevTools → Application → Service Workers: SW registriert?
#    - DevTools → Network → /version.json: frische Response (no-store)?

# 5. Simulierter Versionswechsel:
#    - version.json build-Feld manuell ändern (oder neuen Build anstoßen)
#    - Seite neu laden → Banner erscheint
#    - „Jetzt aktualisieren" klicken → Reload auf neuen Stand
```

### 11.8 Bekannte Grenzen

- **Offline-Unterstützung:** Rudimentär. Nur gecachte Assets funktionieren offline;
  dynamische Inhalte (LocalStorage-Daten) sind nicht betroffen, aber Netzwerkfehler
  liefern den letzten Cache-Stand oder eine 503-Antwort.
- **PNG-Icons:** Derzeit nur SVG-Platzhalter. Für vollständige Installierbarkeit
  auf allen Plattformen sind PNG-Icons 192×192 und 512×512 erforderlich.
- **SW-Tests:** Service Worker-Logik ist nicht vollständig unit-getestet.
  Die testbare Kernlogik (Update-Erkennung via `isUpdateAvailable`) ist durch Tests abgedeckt.
  SW-Verhalten muss manuell via DevTools verifiziert werden.

