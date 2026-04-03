---
id: perspective-record
title: "PerspectiveRecord - Domain Modell"
doc_type: data-model
status: draft
canonicality: derived
summary: "Referenzdokument für das PerspectiveRecord Datenmodell zur Erfassung isolierter Perspektiven."
related_docs:
  - perspektiven-blaupause
  - masterplan
last_reviewed: "2026-03-30"
---

# PerspectiveRecord

Dieses Dokument definiert das Datenmodell für eine `PerspectiveRecord`-Entität. Es stellt sicher, dass Perspektiven als unabhängige Dokumentationsartefakte erhalten bleiben, um epistemische Isolation im Spannungsatlas zu garantieren.

## 1. Minimales Datenmodell

Ein `PerspectiveRecord` fasst die Erkenntnisse eines einzelnen Teammitglieds zu einem bestimmten Fall zusammen.

```typescript
interface PerspectiveRecord {
  id: string;
  case_id: string;
  author_id: string;
  author_label: string;
  created_at: string; // ISO 8601 Date String
  committed_at: string | null; // null solange im Entwurfsstatus
  status: "draft" | "committed";

  visibility_phase: "blind"; // Vorerst immer blind

  content: {
    context_view: string;
    observation: string;
    interpretation: string;
    counter_interpretation: string;
    uncertainty: string;
  };
}
```

## 2. Felddefinitionen

- `id`: Eindeutige Kennung des Perspective-Records.
- `case_id`: Fremdschlüssel zum übergeordneten `Case`.
- `author_id` / `author_label`: Kennung und lesbarer Name/Rolle der verfassenden Person.
- `created_at` / `committed_at`: Zeitstempel des Beginns und des finalen Abschlusses.
- `status`: Steuert die Modifizierbarkeit (`draft` erlaubt Änderungen, `committed` verbietet stille Änderungen).
- `visibility_phase`: Bestimmt die Sichtbarkeit für andere (in Phase 1 strikt `blind`).

### Content-Felder
- `context_view`: Wie erscheint mir die Lage / der Ausschnitt / die Relevanzordnung? Macht die perspektivische Rahmung sichtbar.
- `observation`: Beschreibend, möglichst kameraähnlich.
- `interpretation`: Erste Deutung des Autors.
- `counter_interpretation`: Pflichtfeld, um die innere Selbstkorrektur auch innerhalb einer einzelnen Perspektive zu erhalten.
- `uncertainty`: Pflichtfeld, damit Nichtwissen nicht nachträglich ausradiert wird.

## 3. Lebenszyklus

1. **Draft:** Der Nutzer legt eine neue Perspektive an. Die Daten werden lokal gespeichert, sind jedoch noch veränderbar und für niemanden sonst sichtbar.
2. **Commit:** Der Nutzer schließt die Perspektive ab. Der Status wechselt auf `committed`, ein `committed_at` Zeitstempel wird gesetzt. Ab diesem Moment ist das Objekt schreibgeschützt (keine stillen Änderungen mehr möglich).
3. **Visibility Phase:** Für Phase 1 bleibt die Perspektive selbst nach dem Commit für andere Nutzer unsichtbar ("streng blind").
