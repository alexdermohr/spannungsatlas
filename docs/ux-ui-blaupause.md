> **Hinweis:** Dieses Dokument ist ein konzeptionelles UX/UI-Leitdokument. Bei Konflikten gilt der kanonische Produktmasterplan in `MASTERPLAN.md`.

# Spannungsatlas – UX/UI Blaupause

Dieses Dokument definiert die konzeptionellen UI- und UX-Prinzipien für den Spannungsatlas. Es beschreibt, wie das System als epistemisches Arbeitsinstrument zur Dokumentation, Reflexion und vordiagnostischen Verdichtung visuell und interaktiv aufgebaut ist.

## 1. Leitidee

Der Spannungsatlas ist kein Formular, kein Entscheidungssystem und kein Vorschlagsautomat. Die UI strukturiert nicht nur Inhalte, sondern diszipliniert den Denkprozess selbst.

Das System hat zwei Hauptleistungen:
- **Horizonterweiterung:** Bedürfnisse, Determinanten und Spannungsachsen werden sichtbar gemacht.
- **Denkdisziplin:** Beobachtung, Deutung, Gegen-Deutung und Unsicherheit werden zwingend getrennt.

Das System arbeitet bewusst mit produktiver Irritation: Es zwingt zum Denken, verhindert stille Glättung von Widersprüchen, verlangsamt vorschnelle Urteilsbildung und macht epistemische Unsicherheit visuell erfahrbar.

## 2. Die drei UX-Ebenen

Die UX gliedert sich in drei aufeinander aufbauende Ebenen:

### Ebene A – Explorationsraum
**Frage:** „Welche Bedürfnisse und Determinanten könnten hier überhaupt eine Rolle spielen?“
- **Zweck:** Horizont erweitern, Deutungsraum sichtbar machen, vorschnelle Einspurigkeit bremsen.
- **Form:** Ein strukturierter, durchsuchbarer Katalog (Cluster) mit kurzen Beschreibungen, typischen Auslösern, Verhaltensausprägungen und Fehlinterpretationen. Keine automatischen Vorschläge oder Diagnoselogik.

### Ebene B – Reflexionsraum
**Frage:** „Wie denke ich methodisch sauber über diesen Fall nach?“
- **Zweck:** Denkfehler reduzieren, Beobachtung von Deutung trennen, alternative Erklärungen erzwingen.
- **Elemente:** Situation, Beobachtung, Deutung, Gegen-Deutung, Unsicherheit, Spannungsnetz.

### Ebene C – Vergleichs- und Verdichtungsraum
**Frage:** „Was zeigt sich über Zeit, über Fälle und über Perspektiven hinweg?“
- **Zweck:** Veränderung des Denkens (Drift) und Muster (Spannungsprofil) sichtbar machen, verfestigen verhindern.
- **Elemente:** Fallvergleich, Drift-Klassifikation, Profilverdichtung, Gegenbelege, Multi-Perspektive.

## 3. Primärer Nutzerfluss (Reflexionsraum)

Zonen müssen in zwingender Reihenfolge durchlaufen werden. Die Übergänge sind bewusst gesetzt (keine fließende Formularlogik). Jede Eingabe ist ein bewusster Denkakt ("Commit").

### Schritt 1 – Fall starten
- **Inhalt:** Was ist passiert? Situation, Kontext, Zeitpunkt, beteiligte Person(en).
- **Regel:** Rein faktisch. Noch keine Interpretation.

### Schritt 2 – Beobachtung erfassen
- **Inhalt:** Der Nutzer beschreibt die Handlung.
- **Regel (Kamera-Test):** „Ist diese Beschreibung rein beobachtbar (ohne Interpretation)?“ Das System weist bei interpretativer Sprache auf Trennung hin.

### Schritt 3 – Explorationsraum öffnen
- **Inhalt:** Nach der Beobachtung öffnet sich der Bedürfnis- und Determinantenraum.
- **UI:** Cluster-Ansicht (z. B. Sicherheit, Bindung, Autonomie bzw. interne Zustände, situative Faktoren).
- **Interaktion:** Nutzer markiert relevante Aspekte. Sichtbarkeit und Auswahl fördern den Lernprozess.

### Schritt 4 – Deutung formulieren
- **Inhalt:** Nutzer formuliert einen vorläufigen Denkstand.
- **Regel:** Bezug auf Beobachtung zwingend. Keine Eigenschaftssprache.
- **UI:** Evidenztyp (beobachtungsnah, abgeleitet, spekulativ) muss konsistent angegeben werden. Visuelle Fixierung der Aussage nach dem Commit.

### Schritt 5 – Gegen-Deutung (Widerspruchs-UI)
- **Inhalt:** Das System fordert aktiv eine alternative Erklärung ein („Welche andere Erklärung wäre möglich?“, „Was könnte gegen deine Deutung sprechen?“).
- **Regel:** Ohne Gegen-Deutung kann der Denkstand nicht abgeschlossen werden. Reine Relativierung reicht nicht aus. System prüft, ob alternative Erklärung echte Alternative darstellt.

### Schritt 6 – Unsicherheit markieren
- **Inhalt:** Unsicherheitsgrad und kurze Begründung.
- **UI:** Visuelle Repräsentation (z. B. weiche/unscharfe Darstellung bei hoher Unsicherheit, klare Konturen bei niedriger Unsicherheit). Ohne Begründung keine Speicherung.

### Schritt 7 – Spannungsnetz
- **Inhalt:** Perspektivwechsel von Einzelaussage zur Relation.
- **UI:** Graph. Knoten = Personen/Faktoren, Kanten = Spannungen.
- **Regel:** Kanten benötigen Richtung, Kontext und Zeitbezug. Verhindert abstrakte „Spannungswolken“ (Nicht: „X ist aggressiv“, Sondern: „Zwischen X und Kontext Y entsteht Druck entlang Achse Z“).

### Schritt 8 – Vergleich / Drift / Profil (Verdichtungsraum)
- **Inhalt:** Nach mehreren Fällen.
- **UI:** Denkstände nebeneinander. Drift-Klassifikation (neue Beobachtung, neue Perspektive, Neubewertung). Profilverdichtung mit Gegenbelegen und Revision. Multi-Perspektive hält unterschiedliche Sichtweisen visuell nebeneinander.

## 4. Informationsarchitektur

- **Screen 1 – Dashboard:** Einstieg, letzte Fälle, letzte Revisionen, offene Irritationen, gesuchte Personen.
- **Screen 2 – Neuer Fall:** Flow für Situation, Beobachtung, Exploration, Deutung, Gegen-Deutung, Unsicherheit.
- **Screen 3 – Fallansicht:** Fertiger Denkstand, Spannungsnetz, Revisionen.
- **Screen 4 – Bedürfnisraum / Determinantenkatalog:** Lernfläche, durchsuchbarer Atlas, Clusteransicht.
- **Screen 5 – Personenseite:** Spannungsprofil, Fallverlauf, wiederkehrende Aspekte, Gegenbelege.
- **Screen 6 – Drift / Vergleich:** Denkstände nebeneinander, Veränderung im Denken sichtbar. (Später: Multi-Perspektiven-Modul).

## 5. UI-Prinzipien

1. **Keine Scrollwüste:** Schrittweise Freigabe über Karten, Tabs oder Overlay-Panels statt endloser Formulare.
2. **Commit statt Dauereingabe:** Jede Deutung erfordert einen bewussten Abschluss, um das Gefühl von formloser Textmasse zu vermeiden.
3. **Zwei Blickmodi:** Linear (Fall für Fall) und Relational (Netz, Profil, Drift).
4. **Sichtbare epistemische Qualität:** Evidenztyp, Unsicherheit, Gegen-Deutung und die Begrenzung von Wiederkehr auf Aspektebene müssen visuell ablesbar sein.
5. **Katalog als Lernraum:** Der Bedürfnisraum ist ein eigenständiger Arbeitsraum, kein kleines Dropdown-Menü.

## 6. Technische Zielarchitektur und Module

**Frontend:** SvelteKit oder React + TypeScript. (SvelteKit für Zustandsklarheit, React für Ökosystembreite).
**State:** XState oder leichtgewichtiges Zustandsmodell (Fokus auf Zustandsübergänge im Flow).
**Persistenz:** V1 als Local-First (IndexedDB/SQLite im Desktop-/Hybrid-Kontext). V2 mit Postgres + API.
**Visualisierung:** React Flow / Svelte Flow für Spannungsnetze, eigene Komponenten für Drift-Vergleich.
**API:** JSON-first REST oder tRPC (Echtzeitarchitektur nicht erforderlich).

### Technische Module
- **case-editor:** Situation, Beobachtung, Exploration, Deutung, Gegen-Deutung, Unsicherheit, Commit.
- **epistemic-guards:** Kamera-Test, Evidenztyp-Konsistenz, Gegen-Deutungs-Qualität, Eigenschaftssprache-Hinweise.
- **need-catalog:** Bedürfnisse, Determinanten, Cluster, Verknüpfungen, Auslöser/Verhaltensbilder.
- **case-history:** Denkstände, Revisionen, Drift-Klassifikation.
- **tension-graph:** Nodes, Edges, Richtung, Kontext, Zeitbezug.
- **profiles:** Spannungsprofil, (später: Konstellationsprofil).

## 7. Minimal sinnvolles Datenmodell

```typescript
type EvidenceType = "observational" | "derived" | "speculative";
type DriftType = "new_observation" | "new_perspective" | "reinterpretation";
type UncertaintyLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0 = sicher, 5 = stark spekulativ

interface CaseParticipant {
  id: string;
  role?: "primary" | "secondary" | "staff" | "contextual";
}

interface Case {
  id: string;
  participants: CaseParticipant[];
  context: string;
  observedAt?: string;
  observation: Observation;
  currentReflection: ReflectionSnapshot;
  revisions: Revision[];
}

interface ReflectionSnapshot {
  reflectedAt: string;
  selectedNeeds: NeedSelection[];
  selectedDeterminants: DeterminantSelection[];
  interpretation: Interpretation;
  counterInterpretation: Interpretation;
  uncertainty: Uncertainty;
  tensions: TensionEdge[];
}

interface Observation {
  text: string;
  isCameraDescribable: boolean;
  recurringAspects?: string[];
}

interface Need {
  id: string;
  cluster: string;
  name: string;
  description: string;
  typicalTriggers: string[];
  typicalBehaviors: string[];
  typicalMisreadings?: string[];
}

interface Determinant {
  id: string;
  category: "internal" | "situational" | "biographical";
  name: string;
  description: string;
}

interface NeedSelection {
  needId: string;
  relevance?: number;
}

interface DeterminantSelection {
  determinantId: string;
  intensity?: number;
}

interface Interpretation {
  text: string;
  evidenceType: EvidenceType;
  rationale?: string;
}

interface Uncertainty {
  level: UncertaintyLevel;
  rationale: string;
}

interface TensionEdge {
  source: string;
  target: string;
  label: string;
  context: string;
  direction: "unidirectional" | "bidirectional";
  timestamp?: string;
}

interface Revision {
  at: string;
  driftType: DriftType;
  reason: string;
  from: ReflectionSnapshot;
  to: ReflectionSnapshot;
}
```

## 8. Umsetzungsreihenfolge

- **Phase 1 – Basis:** case-editor, epistemic-guards, lokale Speicherung, einfache Fallliste.
- **Phase 2 – Bedürfnisraum:** need-catalog, Clusterstruktur, Determinantenwahl, visuelle Markierung.
- **Phase 3 – Revision / Drift:** Vergleichsansicht, Denkstände nebeneinander, Drift-Klassifikation.
- **Phase 4 – Spannungsnetz:** Einfacher Graph, auf Fallkontext beschränkt.
- **Phase 5 – Profile / Konstellation:** Spannungsprofil, später Konstellationsprofil und Team-/Rollenlogik.

## 9. ICF-Import-Assistent (Erweiterung)

Zusätzlicher Einstiegspfad:
- Neuer Fall aus ICF-Export

Der ICF-Import-Assistent ist ein alternativer Einstieg **vor** dem regulären Reflexionsraum. Nach Abschluss des Assistenten folgt der normale Flow.

Ablauf:
1. ICF-Datei laden
2. Metadaten prüfen
3. Ratings als Importkarten anzeigen
4. pro Rating auswählen:
   - als Kontext übernehmen
   - als Beobachtungsrohstoff vormerken
   - als Reflexionsanker vormerken
   - ignorieren
5. Übergang in den normalen Reflexionsraum

Regeln:
- keine automatische Bedürfniszuweisung
- keine automatische Determinantenzuweisung
- keine automatische Deutung
- importierte Inhalte bleiben als externe Quelle markiert
