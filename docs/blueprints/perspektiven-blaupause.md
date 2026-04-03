---
id: perspektiven-blaupause
title: "Perspektiven-Blaupause für Spannungsatlas"
doc_type: ux-ui
status: draft
canonicality: canonical
summary: "Konzept zur blinden und unabhängigen Erfassung von Perspektiven, um Anchoring und Konformität zu verhindern."
related_docs:
  - masterplan
  - perspective-record
last_reviewed: "2026-03-30"
---

# Perspektiven-Blaupause für Spannungsatlas

## 1. Ziel
Der Spannungsatlas soll es ermöglichen, dass mehrere Teammitglieder zu demselben Fall je eine eigenständige Perspektive dokumentieren können, ohne durch frühere Perspektiven beeinflusst zu werden.

Nicht Ziel dieser Phase:
- kein Vergleich
- keine Auswertung
- keine Synthese
- keine Diskussion
- keine Kollisionsauflösung

Diese Phase dient ausschließlich der sauberen Erfassung getrennter Blickachsen.

## 2. Grundprinzip
**Kanonische Regel:** Jede Perspektive ist ein eigenständiges Dokumentationsartefakt.

Nicht:
- ein Abschnitt innerhalb eines gemeinsamen Textes
- ein Kommentar unter einem bestehenden Eintrag
- eine Antwort auf eine andere Perspektive

Sondern:
- ein eigener, abgeschlossener Eintrag mit eigener Autorenschaft, eigenem Zeitpunkt und eigener epistemischer Form.

## 3. Fachliche Leitidee
Eine Perspektive ist kein Kommentar, sondern ein eigenständiger Erkenntnisversuch.
Die Dokumentationsstruktur muss verhindern, dass Teammitglieder:
- sich angleichen
- implizit übernehmen, was andere schon geschrieben haben
- früh vorsortierte Deutungen reproduzieren

Die Dokumentationsstruktur soll also nicht Zusammenarbeit maximieren, sondern voreilige Kohärenz verhindern.

## 4. Kernentscheidung: Perspektiven blind erfassen
Perspektiven sollen blind erfasst werden.
Das bedeutet:
- Person B sieht Person A vor ihrer eigenen Abgabe nicht
- Person C sieht A und B vor ihrer eigenen Abgabe nicht
- Reihenfolge ist organisatorisch möglich, aber epistemisch abgeschirmt

So werden Konformitätsdruck, Anchoring und scheinbare Plausibilität durch Wiederholung verhindert. Ziel ist es, echte Differenz und blinde Flecken zu dokumentieren.

## 5. Phase 1 – Blinddokumentation
Statuslogik:
- `draft`: noch nicht abgegeben, bearbeitbar
- `committed`: abgeschlossen, danach nicht mehr still überschreibbar

**Wichtig:** Nach `committed` gibt es keine lautlose Veränderung mehr (nur per neuer Revision oder die Perspektive wird schreibgeschützt).

## 6. Dokumentationsstruktur im Produkt
Ein Fall erhält künftig nicht nur einen einzigen Reflexionskörper, sondern einen Bereich:

```text
Fall
 ├─ Fallrahmen
 ├─ Perspektiven
 │   ├─ Perspektive 1
 │   ├─ Perspektive 2
 │   ├─ Perspektive 3
 │   └─ ...
```

**Kanonische Ordnungslogik:** Perspektiven werden sortiert nach Commit-Zeitpunkt, optional Autorlabel und Rolle. Diese Sortierung ist technisch, nicht epistemisch.

## 7. UI-Blaupause – Dokumentationsstruktur
In der Fallansicht gibt es einen neuen Abschnitt **Perspektiven** mit:
- Anzahl vorhandener Perspektiven
- Eigenem Button: „Neue Perspektive erfassen“
- Keine Sichtbarkeit anderer Perspektiven-Inhalte vor dem eigenen Commit.

**Erfassungsformular:**
1. Eigene Rahmung / Kontextsicht
2. Beobachtung
3. Deutung
4. Gegen-Deutung
5. Unsicherheit

Optional: Rolle / Funktion im Team, freies Kurzlabel.

**Sichtbarkeitslogik (Nach Commit):**
Modus A – streng blind (Empfehlung für Phase 1):
Auch nach Commit sieht man andere Perspektiven erst später, wenn eine entsprechende Phase freigeschaltet wird.

## 8. Dokumentationsinvarianten
- **Invariante 1:** Eine Perspektive gehört genau zu einem Fall.
- **Invariante 2:** Eine Perspektive hat genau einen Autor.
- **Invariante 3:** Eine Perspektive ist vor Commit privat.
- **Invariante 4:** Nach Commit ist sie nicht still editierbar.
- **Invariante 5:** Beobachtung, Deutung, Gegen-Deutung und Unsicherheit sind getrennte Felder.
- **Invariante 6:** Andere Perspektiven sind während der Blindphase nicht sichtbar.

## 9. Datenmodell-Anpassung
Neue Entität: `PerspectiveRecord`.
Der `Case` wird erweitert um `perspectives: PerspectiveRecord[]`.
Der bisherige Reflexionskern des Falls wird mittelfristig zum Fallrahmen oder der initialen Master-Perspektive überführt.
