---
id: psych-modelle-blaupause
title: "Psychologische Modelle als Wissensmodule"
doc_type: architecture
status: draft
canonicality: canonical
summary: "Konzept zur initialen Sammlung kanonischer Spannungsmodelle (Stressfenster, Yerkes-Dodson, Maslow, Big Five) als epistemisch markierte Wissensartefakte."
related_docs:
  - masterplan
  - roadmap
last_reviewed: "2026-04-16"
---

# Psychologische Modelle als Wissensmodule

> **Phasenschnitt:**
> Dieser Blueprint beschreibt Phase A (Sammeln + Strukturieren + Doku-Einordnung) für psychologische Modelle im Spannungsatlas. Er etabliert formale, epistemisch markierte Datenartefakte ohne vorzeitige Domainmodell-Erweiterung (es gibt noch keine Berechnungslogik, Modellanwendung auf Cases oder UI-Integration). Diese Artefakte dienen vorerst als referenzierbare Wissensbausteine.

## These
Die drei Tafelbilder liefern genau das, was dem Spannungsatlas bislang fehlt: kanonische Spannungsmodelle (Fenster, Leistungskurve, Bedürfnisstruktur) als integrierbare Wissensmodule.

## Antithese
Unstrukturiert gesammelt bleiben sie:
→ didaktische Skizzen, aber nicht systemisch anschlussfähig (keine Typisierung, keine Contracts, keine Relationen).

## Synthese
Wir überführen sie in Repo-kompatible, epistemisch markierte Wissensartefakte. Sie werden pro Modell als einzelne Datei abgelegt, um Adressierbarkeit und spätere Erweiterbarkeit (Validierung via Contracts) zu garantieren.

---

## 1. Extraktion (roh, belegt aus Bildern)

### (A) Spannungsfenster / Regulation
- Oberanspannung
- Unterspannung / Erschöpfung
- „Stresstoleranzfenster“ (mittlerer Bereich)
- Dynamik: Sprung über Grenze + Absturz

**Interpretation (plausibel, nicht explizit beschriftet):**
- Rückkehrbewegung implizit (Pfeile)
- nicht-lineare Regulation

---

### (B) Yerkes-Dodson / Leistungskurve
- Leistung ↑ mit Anspannung (bis Optimum)
- danach Leistungsabfall
- Hinweis: „mittlere Schwierigkeit → Erfolg“
- implizit: Erfolgsorientierung

---

### (C) Bedürfnisstruktur (Maslow + Traits)
- **Maslow-Pyramide:**
  - Biologische Bedürfnisse
  - Sicherheit
  - Bindung
  - Anerkennung
  - Selbstverwirklichung
- **Trennung:**
  - Hygiene vs. Wachstumsbedürfnisse
- **Big Five als flankierende Dimension:**
  - Extraversion, Neurotizismus, Offenheit, Verträglichkeit, Gewissenhaftigkeit

---

## 2. Repo-Integration (entscheidend)

### 2.1 Neuer Katalog-Typ: psych_model
Jedes Modell wird unter `data/catalog/psych-models/` abgelegt. Es handelt sich um *vorläufige Seed-Daten*, da ein zwingender Validation-Contract (z.B. JSON-Schema) erst in Phase B definiert wird.

---

## 3. Konkrete Artefakte

Diese werden bewusst mit epistemischen Markern versehen (z.B. `source_origin`, `evidence_status`, `limitations`), um nicht fälschlicherweise eine harte Messphysik zu suggerieren.

### 3.1 Stressfenster (`stress-window.yaml`)
```yaml
id: model.stress_window
type: psych_model
label: Stresstoleranzfenster
dimension: tension_regulation
source_origin: didactic_capture
evidence_status: heuristic
limitations:
  - heuristic_regulation_model
  - not_a_strict_measurement
states: ...
transitions: ...
properties: ...
```

### 3.2 Yerkes-Dodson (`yerkes-dodson.yaml`)
```yaml
id: model.yerkes_dodson
type: psych_model
label: Yerkes-Dodson-Gesetz
dimension: performance
source_origin: didactic_capture
evidence_status: heuristic
limitations:
  - not_a_universal_performance_law
  - simplifies_complex_arousal_relationships
variables: ...
relationship: ...
implications: ...
```

### 3.3 Bedürfnisstruktur (`maslow.yaml`)
```yaml
id: model.maslow
type: psych_model
label: Bedürfnishierarchie
source_origin: didactic_capture
evidence_status: heuristic
limitations:
  - culturally_contingent
  - not_a_strict_universal_sequence
levels: ...
meta: ...
```

### 3.4 Traits als Modulator (`big-five.yaml`)
```yaml
id: model.big_five
type: psych_model
label: Persönlichkeitsdimensionen
source_origin: didactic_capture
evidence_status: heuristic
limitations:
  - simplifies_personality
  - trait_expression_is_context_dependent
traits: ...
role: ...
```

---

## 4. Alternative Sinnachse (kritisch wichtig)

Bisher Ziel des Atlas:
→ „Spannung sichtbar machen“

Alternative (mächtiger):
→ „Warum ist Spannung überhaupt da?“

→ Shift von:
- Zustand → Mechanismus
- Beschreibung → Erklärung

---

## 5. Typische Fehlannahmen (aktiv korrigiert)
1. **„Unterspannung = gut / entspannt“**
   → falsch → kann Dysregulation sein
2. **„Mehr Anspannung = mehr Leistung“**
   → nur bis Kipppunkt
3. **„Bedürfnisse sind statisch“**
   → sind dynamisch + kontextabhängig

---

## 6. Risikoanalyse

**Nutzen:**
- strukturelle Erweiterung des Atlas
- anschlussfähig an reale Psychologie
- Grundlage für Interventionen

**Risiken:**
- Modellüberladung (zu viele Theorien)
- falsche Universalisierung (Maslow ist kulturell biased)
- UI-Komplexität steigt stark

---

## 7. Epistemische Leerstelle

**Fehlt:**
- Wie werden Modelle kombiniert?
- Priorisierung bei Konflikt (z. B. Bedürfnis vs. Leistung)
- Messbarkeit (Skalen fehlen komplett)

→ Dies wird in späteren Phasen im Rahmen von Contract-Validierung (Phase B) und Runtime-Integration (Phase C) gelöst.

---

## 8. Resonanz vs. Kontrast

**Lesart A (systemisch sauber):**
→ Modelle als Katalog (optional zuschaltbar)

**Lesart B (radikal):**
→ Modelle als Berechnungsbasis für Spannungszustände

→ B ist mächtiger, aber gefährlich (Pseudo-Objektivität). Derzeit wird Lesart A als isoliertes, adressierbares Wissensmodul-Set verfolgt.
