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

Das Vite-Plugin in `apps/web/vite.config.ts` erzeugt die App-Version einmalig beim Start von Vite.

```json
{
  "release": "0.1.0",
  "build": "abc1234",
  "commit": "abc1234",
  "builtAt": "2026-03-30T18:00:00.000Z"
}
```

**Im Build** (`npm run build:web`) schreibt der `buildStart`-Hook `apps/web/static/version.json`
in den Quellbaum. Gleichzeitig wird `__APP_VERSION__` als globale Konstante in den App-Code eingebettet.

**Im Dev-Modus** (`npm run dev`) liefert ein `configureServer`-Middleware `/version.json`
direkt aus dem Speicher — die Datei `apps/web/static/version.json` wird dabei nicht geschrieben.

In beiden Fällen stammen `__APP_VERSION__` und der Inhalt von `/version.json` aus demselben
`getBuildVersion()`-Aufruf zur selben Vite-Startzeit. Sie gehören damit immer zur selben
laufenden App-Instanz.

`apps/web/static/version.json` ist ein generiertes Artefakt und nicht im Repository eingecheckt.

#### Vercel-Deployment und Atomizität

Vercel ist darauf ausgelegt, Deployments atomar zu aktivieren – d. h. alle Dateien einer
Deployment-URL sind aus demselben Build-Artefakt. Das bedeutet in der Praxis, dass `version.json`
und die zugehörigen Assets zur selben Deployment-Version gehören. Ein Mischzustand (neues
`version.json`, alte Assets) ist unter normalen Vercel-Deployments nicht vorgesehen.
Bei Edge-Cache-Konfigurationen außerhalb von Vercels Standard kann das Verhalten abweichen;
das ist aber für dieses Projekt nicht relevant.

Der einzige verbleibende Edge-Fall – offene Tabs während eines Deploys – ist durch den
Update-Flow abgedeckt.

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

### 11.4 Clientseitige Update-Erkennung und Update-Flow

`UpdateBanner.svelte` (eingebunden in `+layout.svelte`) prüft alle 5 Minuten
und bei Tab-Fokus, ob `version.json` am Server eine neuere `build`-ID hat.

Falls ja: dezenter Banner unten rechts mit „Neue Version verfügbar – Jetzt aktualisieren".

**Aktivierungssequenz:**
1. Nutzer klickt „Jetzt aktualisieren"
2. `SKIP_WAITING` wird an den wartenden Service Worker gesendet
3. Der neue SW übernimmt → feuert `controllerchange`-Event
4. Erst dann lädt die Seite neu (race-free: kein Reload vor vollständiger SW-Übernahme)
5. Sicherheits-Timeout (1,5 s): Falls `controllerchange` nicht feuert, Reload trotzdem

Der Banner funktioniert auch ohne aktiven Service Worker (dann direkter Reload).

**Multi-Tab-Verhalten:**
- Nur der Tab, der den Banner bestätigt, löst `SKIP_WAITING` aus
- Alle anderen offenen Tabs bekommen nach ihrem nächsten Fokus-Wechsel ebenfalls
  den Banner angezeigt (nächste `version.json`-Prüfung)
- Sie laden beim nächsten Klick auf „Jetzt aktualisieren" ebenfalls neu

#### Debug-Logging

Im Dev-Modus werden version-Check und SW-State als `console.debug`-Ausgaben
unter dem Präfix `[spannungsatlas]` geloggt (nur wenn `import.meta.env.DEV`):

```
[spannungsatlas] version check { current: "abc123", remote: "def456", updateAvailable: true }
[spannungsatlas] SW state { active: "activated", waiting: "none", installing: "none" }
```

In Produktionsbuilds werden diese Ausgaben nicht erzeugt.

### 11.5 PWA-Basis

- Manifest: `apps/web/static/manifest.webmanifest`
- Theme-Color: `#2d5a9b` (App-Akzentfarbe)
- Icon: `apps/web/static/icons/icon.svg` (SVG-Platzhalter – für vollständige Browser-Unterstützung
  sollten PNG-Icons in 192×192 und 512×512 ergänzt werden)

### 11.6 Cache-Control-Header auf Vercel

Konfiguriert in `vercel.json`. Die Regeln sind so geordnet, dass spezifischere Einträge
(z. B. `/version.json`) vor der allgemeinen Catch-All-Regel stehen:

| Pfad | Cache-Control | Begründung |
|---|---|---|
| `/version.json` | `no-store, max-age=0` | Immer frisch – Versionswahrheitsquelle |
| `/service-worker.js` | `no-store, max-age=0` | Browser-SW-Update-Mechanismus |
| `/_app/immutable/…` | `public, max-age=31536000, immutable` | Content-hashed, nie veraltet |
| alle anderen Pfade | `no-cache, must-revalidate` | HTML und statische Assets: immer revalidieren |

**Hinweis:** Die Catch-All-Regel `/((?!_app/).*)` ist darauf ausgelegt, alles außer `/_app/`
zu erfassen. Negative Lookaheads in Header-Source-Patterns sind auf Vercel zulässig, wenn korrekt
gruppiert. Falls diese Regel auf einem bestimmten Deployment nicht greift, können pro HTML-Route
explizite Regeln ergänzt werden.

### 11.7 Verifikation (manuell)

```bash
# 1. Build
npm run build:web

# 2. Generierte version.json prüfen
cat apps/web/static/version.json
# Erwartet: { release, build, commit, builtAt } – alle Felder befüllt

# 3. Lokaler Vorschau-Server (Produktionsbuild)
npm run preview --workspace=apps/web
```

**Hinweis zum Dev-Server:** Im Dev-Modus (`npm run dev`) wird `/version.json` direkt aus dem
Speicher des Vite-Dev-Servers geliefert (via `configureServer`-Middleware). Der Inhalt stimmt
immer mit `__APP_VERSION__` überein, unabhängig vom Dateisystem-Stand.

**Browser DevTools:**

| Prüfpunkt | Wo | Erwartetes Ergebnis |
|---|---|---|
| Manifest geladen | Application → Manifest | Name, Theme-Color, Icon |
| SW registriert | Application → Service Workers | Status "activated and is running" |
| `version.json` frisch | Network → /version.json | `Cache-Control: no-store` in Response-Headers |
| Debug-Log | Console (level: Verbose) | `[spannungsatlas] version check` (nur im Dev-Modus) |

**Update-Flow-Verifikation (über echtes Deployment):**

Das Banner erscheint, wenn das abgerufene `/version.json` einen anderen `build`-Wert trägt als
`__APP_VERSION__.build` des laufenden Standes. Zuverlässig verifizierbar über zwei aufeinanderfolgende Deployments:

1. Ersten Stand deployen, App in einem Tab öffnen
2. Zweiten Stand deployen (z. B. neuer Commit auf Vercel)
3. Tab nicht neu laden — beim nächsten Polling-Intervall erscheint das Banner automatisch
4. „Jetzt aktualisieren" klicken → Seite lädt auf neuen Stand
5. Multi-Tab: weitere offene Tabs zeigen den Banner nach dem nächsten Fokus-Wechsel

> **Hinweis:** `apps/web/static/version.json` ist ein Build-Artefakt.
> Eine Änderung an dieser Quelldatei nach dem Build beeinflusst den bereits gebauten Preview-Stand nicht —
> die Datei wurde beim Build in den Output kopiert.
> Console-Logs (`[spannungsatlas] version check …`) erscheinen nur im Dev-Modus.

### 11.8 Bekannte Grenzen

- **Offline-Unterstützung:** Rudimentär. Nur gecachte Assets funktionieren offline;
  dynamische Inhalte (LocalStorage-Daten) sind nicht betroffen, aber Netzwerkfehler
  liefern den letzten Cache-Stand oder eine 503-Antwort.
- **PNG-Icons:** Derzeit nur SVG-Platzhalter. Für vollständige Installierbarkeit
  auf allen Plattformen sind PNG-Icons 192×192 und 512×512 erforderlich.
- **SW-Tests:** Service Worker-Lifecycle ist nicht vollständig unit-getestet.
  Die testbare Kernlogik (Update-Erkennung via `isUpdateAvailable`) ist durch Tests abgedeckt.
  SW-Verhalten muss manuell via DevTools verifiziert werden.
- **Vercel Regex-Headers:** Das Catch-All-Pattern `/((?!_app/).*)` für HTML-Cache-Headers
  setzt voraus, dass Vercel negative Lookaheads in Header-Source-Patterns unterstützt.
  Falls nicht: pro HTML-Route explizite Regeln ergänzen.

