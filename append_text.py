import re

text = """These: Für Deployment ist das Repo noch nicht technisch bereit, aber konzeptionell gut vorbereitet.
Antithese: Man könnte trotzdem „einfach auf Vercel deployen“. Das wäre bequem, aber derzeit nur das Deployment eines Gedankens über ein Produkt, nicht des Produkts selbst.
Synthese: Ideal ist jetzt kein Direkt-Deploy, sondern ein Deployment-Prep in drei sauber getrennten Schritten: erst Web-App-Grundgerüst, dann produktlogische Anbindung, dann kontrollierte Deploy-Schicht.

Diagnose

Der aktuelle Repo-Zustand ist klar:
	•	Es gibt keine eigentliche Web-App im Tree, sondern Doku, Domain-Code, Docmeta-Skripte und Tests. Die Struktur enthält docs, src/domain, scripts/docmeta, tests/domain, aber kein apps/web oder sonstige Runtime-Schicht.  ￼
	•	package.json hat nur:
	•	"build": "tsc --noEmit"
	•	"test": "vitest run"
also Typprüfung und Tests, aber keinen App-Build, keinen Dev-Server, keinen Startpfad, keine Deploy-Adapter-Konfiguration.  ￼
	•	Der Architektur-Snapshot erkennt keine Kernmodule und meldet im Wesentlichen Doku-/Infra-lastige Struktur.  ￼
	•	Gleichzeitig ist die Zielrichtung dokumentiert: docs/deploy-blaupause.md sieht Vercel für UI/Preview, einen entkoppelten Produktkern und als Zielstruktur ein späteres apps/web vor.
	•	Die UX-Blaupause legt für V1 local-first und für spätere Ausbaustufen Postgres + API fest.  ￼

Die wichtigste Korrektur an einer typischen Fehlannahme lautet also:

Fehlannahme: „Deployment vorbereiten“ heißt hier vor allem Hosting wählen.
Korrektur: Nein. Hier heißt es zuerst: aus dokumentierter Architektur eine deploybare Softwareform machen.

Alternative Sinnachse

Nicht nur:
„Wie deploye ich Spannungsatlas?“

Sondern zuerst:
„Welche Schicht des Systems darf überhaupt schon deployt werden?“

Im Moment ist die ehrliche Antwort:
	•	deploybar bald: UI-/Preview-Schicht
	•	noch nicht deploybar als Produktkern: echte Fallanwendung mit Persistenz, Rollen, Rechteprüfung, Audit, Exportkontrolle

Das ist wichtig, weil dein Produkt laut Masterplan kein nettes Formular ist, sondern ein Reflexions- und Vordiagnostiksystem mit Trennung von Beobachtung, Deutung, Gegen-Deutung, Unsicherheit und rollenbasierter Begrenzung.  ￼

Ideale Vorbereitung auf Deployment

1. Phase A — Repo deploybar machen, ohne das Produkt zu verfälschen

Das ist der eigentliche nächste Schritt.

Ziel

Ein echtes apps/web, das:
	•	auf Vercel deploybar ist,
	•	aber noch nicht vorgibt, der vollständige Produktkern zu sein.

Konkret
	•	apps/web anlegen
	•	SvelteKit + TypeScript verwenden
Das ist konsistent mit deiner Deploy-Blaupause und der UX-Blaupause.
	•	Root nicht unnötig aufblasen
	•	src/domain als produktlogischen Kern beibehalten
	•	Web-App konsumiert Domain-Typen und Guards, ersetzt sie aber nicht

Warum das ideal ist

Weil die Blaupause genau dieses Modell vorgibt:
	•	Weboberfläche = konsumierende Schicht
	•	Produktkern = semantische Wahrheitsschicht
	•	spätere API/Persistenz = eigene Infrastrukturphase  ￼

Was dafür minimal fehlen muss
	•	echter Web-Build
	•	Routing
	•	Seiten-/Komponentenstruktur
	•	Vercel-Adapter
	•	Deploy-Konfiguration

X fehlt, nötig für Y:
Es fehlt aktuell ein tatsächlicher Web-App-Einstiegspunkt. Das ist nötig, um überhaupt einen sinnvollen Deploy-Output zu erzeugen.

⸻

2. Phase B — Produktlogik in UI-fähige Schnitte bringen

Im Repo gibt es bereits den Reflexionskern in src/domain plus Tests. Das ist gut. Aber die UX-Zielarchitektur ist breiter als die bisher implementierten Typen. Die UX-Blaupause sagt selbst explizit, dass das dort gezeigte vollständige Datenmodell noch nicht vollständig implementiert ist; implementiert ist derzeit nur der Phase-1-Reflexionskern.  ￼

Daher ideal vorbereiten heißt:
	•	Domain stabil halten
	•	vor UI-Bau den echten Phase-1-Schnitt definieren
	•	nicht sofort das ganze Zielmodell bauen

Empfehlung

Erst diese Screens minimal ermöglichen:
	•	Dashboard
	•	Neuer Fall
	•	Fallansicht
	•	Vergleich/Drift als Platzhalter
	•	ICF-Import noch nicht voll, eher als Hook/Stub

Das entspricht dem dokumentierten MVP-Zielbild in der Deploy-Blaupause.  ￼

Prämissencheck

Diese Empfehlung gilt, wenn du wirklich schnell zu klickbaren Previews willst, ohne schon Datenhaltung und Berechtigungen fertig zu haben.
Falls du stattdessen sofort einen echten Multi-User-Produktkern willst, wäre ein Vercel-first-Weg zu früh und zu oberflächlich.

⸻

3. Phase C — Deployment-Schnitt klar festlegen

Aus den Dokumenten ergibt sich die richtige Reihenfolge ziemlich eindeutig:

Jetzt deployen
	•	nur die Web-/Preview-Schicht auf Vercel
	•	mit Demo- oder Local-first-Daten
	•	ohne zentrale sensible Produktdaten

Noch nicht deployen als „echtes Produkt“
	•	Rechte-/Rollenlogik
	•	zentrale Persistenz
	•	Export-/Auditmechanik
	•	echte Profilverdichtung mit Teambetrieb

Die Blaupause sagt selbst:
	•	Vercel ist für UI/Preview
	•	spätere Persistenz/Rechte/Audit sind getrennte Kernschicht
	•	V1 local-first, später Postgres + API

Deshalb lautet die ideale Zielarchitektur jetzt

Kurzfristig
	•	Frontend: SvelteKit in apps/web
	•	Hosting: Vercel
	•	Daten: lokal/mock/local-first
	•	Build-Ziel: Preview-Deploys pro Branch/PR

Mittelfristig
	•	API: getrennte App-Schicht, nicht Frontend-Logik missbrauchen
	•	DB: Postgres
	•	Rechte: erst dann echte Team-/Falldaten

Was ich jetzt sofort tun würde

1. Repo-Schnitt technisch herstellen
	•	apps/web anlegen
	•	SvelteKit minimal initialisieren
	•	src/domain importierbar machen
	•	Root-Skripte sauber ergänzen:
	•	build:web
	•	check:web
	•	test:web
	•	optional Workspace, aber nur wenn wirklich nötig

2. Minimalen deploybaren UI-Seed bauen
	•	/ → Dashboard/Intro
	•	/cases/new
	•	/cases/[id]
	•	einfache Local-first-Persistenz
	•	erste Guards aus src/domain in UI spiegeln

3. Vercel anschließen
	•	Root Directory klar
	•	Preview Deployments
	•	Production nur Demo-Schicht

4. Noch nicht tun
	•	keine zentrale DB
	•	keine halbgare Auth
	•	keine falsche „Produktiv“-Behauptung
	•	kein Mischmasch aus Preview-Schicht und Produktkern

Konkreter idealer Arbeitsplan

Schritt 1 — Deployment-Prep-PR 1

Ziel: apps/web + SvelteKit + Vercel-fähiges Grundgerüst
Inhalt:
	•	apps/web
	•	SvelteKit
	•	Adapter Vercel
	•	saubere README-/docs-Ergänzung
	•	keine Business-Logik aufblasen

Schritt 2 — Deployment-Prep-PR 2

Ziel: Phase-1-Reflexionsraum ankoppeln
Inhalt:
	•	Fall starten
	•	Beobachtung
	•	Deutung
	•	Gegen-Deutung
	•	Unsicherheit
	•	lokale Speicherung

Schritt 3 — Deployment-Prep-PR 3

Ziel: Vercel Preview produktiv für Demos
Inhalt:
	•	Vercel-Projekt
	•	Branch-/PR-Deployments
	•	Demo-Datensätze
	•	Smoke-Checks

Schritt 4 — später

Ziel: API + Postgres + Rollen
Inhalt:
	•	erst wenn UI-/Flow-Lernen wirklich stabil ist

Risiko-/Nutzenabschätzung

Nutzenklassen
	•	operative Geschwindigkeit
	•	sichtbarer Fortschritt
	•	Reviewbarkeit per Preview
	•	frühe UX-Validierung
	•	saubere Trennung von Kern und Oberfläche

Risikoklassen
	•	technisch: UI und Domain verkleben
	•	semantisch: Demo wird mit Produkt verwechselt
	•	organisatorisch: Datenschutz-/Rechtefragen werden zu spät behandelt
	•	architektonisch: lokale V1-Strategie wird durch Hosting-Euphorie überrollt

Größtes Risiko

Zu früh eine „echte“ Deployment-Geschichte zu spielen, obwohl das Repo derzeit noch Produktgrammatik, nicht Produktoberfläche enthält.

Belegt / plausibel / spekulativ

Belegt
	•	aktuelles Repo enthält keine Web-App-Struktur, sondern Doku, Domain, Scripts, Tests.  ￼
	•	package.json baut derzeit nur Typprüfung und Tests, keine App.  ￼
	•	Deploy-Blaupause setzt auf Vercel für UI und entkoppelten Kern.  ￼
	•	UX-Blaupause sieht V1 local-first, später Postgres + API.  ￼

Plausibel
	•	SvelteKit in apps/web ist der richtige erste technische Schnitt.
	•	Vercel sollte zuerst nur Preview-/Demo-Schicht tragen.

Spekulativ
	•	Ob du mittelfristig eher Single-Tenant, Trägerbetrieb oder echtes SaaS willst.
X fehlt, nötig für Y: Es fehlt die Betriebsentscheidung für reale Falldaten. Die ist nötig, um den späteren API-/DB-Betrieb endgültig festzulegen.

Essenz

Hebel: Erst deploybare Form herstellen, dann hosten.
Entscheidung: Jetzt apps/web + SvelteKit + Vercel-Preview-Schicht aufbauen; echten Produktkern noch nicht als Internet-Produkt behandeln.
Nächste Aktion: Ein sauberer PR für „Phase 0: apps/web + SvelteKit + Vercel-ready Grundgerüst“.

Unsicherheitsgrad: 0.14
Ursachen: offen sind spätere Betriebsform, reale Datenhaltung und Rechtearchitektur.

Interpolationsgrad: 0.12
Hauptannahmen: dass du mit „ideal vorbereiten“ den besten nächsten technischen Schnitt meinst und nicht bloß eine Hosting-Entscheidung.

Der passende trockene Witz: Im Moment ist Spannungsatlas sehr gut darin, über Deployment nachzudenken. Jetzt muss er nur noch anfangen, etwas zu haben, das deployed werden kann."""

clean_text = text.replace("￼", "")

# Fix markdown format by converting to valid markdown layout
lines = clean_text.split("\n")
new_lines = []

in_list = False

new_lines.append("\n## 11. Deployment-Prep-Strategie\n")

for line in lines:
    line = line.replace("\t•\t", "- ")
    new_lines.append(line)


with open("docs/deploy-blaupause.md", "a") as f:
    f.write("\n".join(new_lines))
