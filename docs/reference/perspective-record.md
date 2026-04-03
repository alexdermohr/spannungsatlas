---
id: perspective-record
title: "PerspectiveRecord – Referenz des Perspektiven-Datenmodells"
doc_type: data-model
status: draft
canonicality: derived
summary: "Referenzdokument für das Perspektiven-Datenmodell (PerspectiveRecord) zur Erfassung isolierter Perspektiven."
related_docs:
  - perspektiven-blaupause
  - masterplan
last_reviewed: "2026-04-03"
---

# PerspectiveRecord – Referenz des Perspektiven-Datenmodells

Dieses Dokument operationalisiert und konkretisiert das Datenmodell für die in der [Perspektiven-Blaupause](../blueprints/perspektiven-blaupause.md) festgelegte Entität `PerspectiveRecord`. Es stellt technisch sicher, dass Perspektiven als unabhängige Dokumentationsartefakte erhalten bleiben, um epistemische Isolation im Spannungsatlas zu garantieren.

## 1. Minimales Datenmodell

Ein `PerspectiveRecord` fasst die Erkenntnisse eines einzelnen Teammitglieds zu einem bestimmten Fall zusammen. Die konkrete Integration dieses Objekts in das bestehende Fallmodell wird bewusst nicht hier festgelegt.

```typescript
interface PerspectiveRecord {
  id: string;
  caseId: string;
  authorId: string;
  authorLabel: string;
  createdAt: string; // ISO 8601 Date String
  committedAt: string | null; // null solange im Entwurfsstatus
  status: "draft" | "committed";

  visibilityPhase: "blind"; // Vorerst immer blind

  content: {
    contextView: string;
    observation: Observation;
    interpretation: Interpretation;
    counterInterpretations: Interpretation[];
    uncertainties: Uncertainty[];
  };
}
```

## 2. Felddefinitionen

- `id`: Eindeutige Kennung des Perspective-Records.
- `caseId`: Fremdschlüssel zum übergeordneten `Case`.
- `authorId` / `authorLabel`: Kennung und lesbarer Name/Rolle der verfassenden Person.
- `createdAt` / `committedAt`: Zeitstempel des Beginns und des finalen Abschlusses.
- `status`: Steuert die Modifizierbarkeit (`draft` erlaubt Änderungen, `committed` verbietet stille Änderungen).
- `visibilityPhase`: Bestimmt die Sichtbarkeit für andere (in Phase 1 strikt `blind`).

### Content-Felder
- `contextView`: Wie erscheint mir die Lage / der Ausschnitt / die Relevanzordnung? Macht die perspektivische Rahmung sichtbar.
- `observation` (Typ `Observation`): Beschreibend, möglichst kameraähnlich.
- `interpretation` (Typ `Interpretation`): Erste Deutung des Autors.
- `counterInterpretations`: Pflichtfeld (mindestens eine), um die innere Selbstkorrektur auch innerhalb einer einzelnen Perspektive zu erhalten.
- `uncertainties`: Pflichtfeld (mindestens eine), damit Nichtwissen nicht nachträglich ausradiert wird.

*Hinweis: Das Content-Modell schließt explizit an die bestehende Domain-Semantik (z. B. `Observation`, `Interpretation`, `Uncertainty`) des Reflexionskerns an, um keine konkurrierende Datenwahrheit zu erzeugen. Es ist jedoch auf die Erfassung der isolierten Perspektive einer einzelnen Person fokussiert.*

## 3. Lebenszyklus

1. **Draft:** Der Nutzer legt eine neue Perspektive an. Die Daten werden lokal gespeichert, sind jedoch noch veränderbar und für niemanden sonst sichtbar.
2. **Commit:** Der Nutzer schließt die Perspektive ab. Der Status wechselt auf `committed`, ein `committedAt` Zeitstempel wird gesetzt. Ab diesem Moment ist das Objekt schreibgeschützt (keine stillen Änderungen mehr möglich).
3. **Visibility Phase:** Für Phase 1 bleibt die Perspektive selbst nach dem Commit für andere Nutzer unsichtbar ("streng blind").
