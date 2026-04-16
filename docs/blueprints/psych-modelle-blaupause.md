---
id: psych-modelle-blaupause
title: "Psychologische Modelle als Wissensmodule"
doc_type: ux-ui
status: draft
canonicality: canonical
summary: "Konzept zur Integration kanonischer Spannungsmodelle (Stressfenster, Yerkes-Dodson, Maslow, Big Five) als strukturierte Artefakte."
related_docs:
  - masterplan
  - ux-ui-blaupause
last_reviewed: "2026-04-16"
---

# Psychologische Modelle als Wissensmodule

## These
Die drei Tafelbilder liefern genau das, was dem Spannungsatlas bislang fehlt: kanonische Spannungsmodelle (Fenster, Leistungskurve, Bedürfnisstruktur) als integrierbare Wissensmodule.

## Antithese
Unstrukturiert gesammelt bleiben sie:
→ didaktische Skizzen, aber nicht systemisch anschlussfähig (keine Typisierung, keine Contracts, keine Relationen).

## Synthese
Wir überführen sie in Repo-kompatible, wiederverwendbare Wissensartefakte (→ Katalog + Domain anschlussfähig).

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

```yaml
id: model.stress_window
type: psych_model
label: Stresstoleranzfenster
category: regulation
```

---

## 3. Konkrete Artefakte (copy-paste-fähig)

### 3.1 Stressfenster

```yaml
id: model.stress_window
type: psych_model
label: Stresstoleranzfenster
dimension: tension_regulation

states:
  - id: hyperarousal
    label: Oberanspannung
  - id: window
    label: Reguliertes Spannungsfenster
  - id: hypoarousal
    label: Unterspannung / Erschöpfung

transitions:
  - trigger: stress_increase
    from: window
    to: hyperarousal
  - trigger: depletion
    from: window
    to: hypoarousal

properties:
  recovery_required: true
  non_linear: true
```

---

### 3.2 Yerkes-Dodson

```yaml
id: model.yerkes_dodson
type: psych_model
label: Yerkes-Dodson-Gesetz
dimension: performance

variables:
  - arousal
  - performance

relationship:
  type: inverted_u

implications:
  - optimal_mid_arousal
  - overload_degrades_performance
```

---

### 3.3 Bedürfnisstruktur

```yaml
id: model.maslow
type: psych_model
label: Bedürfnishierarchie

levels:
  - physiological
  - safety
  - bonding
  - esteem
  - self_actualization

meta:
  split:
    hygiene: [physiological, safety]
    growth: [bonding, esteem, self_actualization]
```

---

### 3.4 Traits als Modulator

```yaml
id: model.big_five
type: psych_model
label: Persönlichkeitsdimensionen

traits:
  - extraversion
  - neuroticism
  - openness
  - agreeableness
  - conscientiousness

role:
  modifies:
    - stress_window_width
    - arousal_response
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

→ nötig für operative Nutzung

---

## 8. Resonanz vs. Kontrast

**Lesart A (systemisch sauber):**
→ Modelle als Katalog (optional zuschaltbar)

**Lesart B (radikal):**
→ Modelle als Berechnungsbasis für Spannungszustände

→ B ist mächtiger, aber gefährlich (Pseudo-Objektivität)

---

## 9. Unsicherheitsgrad: 0.22

**Ursachen:**
- visuelle Interpretation relativ eindeutig
- aber semantische Formalisierung nicht explizit gegeben

---

## 10. Interpolationsgrad: 0.34

**Annahmen:**
- Mapping auf YAML/Domain
- Ergänzung von impliziten Konzepten (Transitions, Modulation)

---

## Essenz

**Hebel:**
→ Psychologische Modelle als strukturierte Artefakte einführen

**Entscheidung:**
→ Katalog-System um psych_model erweitern

**Nächste Aktion:**
→ 3 Modelle ins Repo legen + Relation zu Cases definieren
