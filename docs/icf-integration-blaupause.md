---
id: icf-integration-blaupause
title: "Spannungsatlas – ICF-Integrations-Blaupause"
doc_type: integration
status: active
canonicality: canonical
summary: "Konzeptionelle Integration von icf-tool in den Spannungsatlas als strukturierte Vorinformation."
related_docs:
  - masterplan
  - ux-ui-blaupause
last_reviewed: "2026-03-28"
---

# Spannungsatlas – ICF-Integrations-Blaupause

> Hinweis: Dieses Dokument beschreibt die konzeptionelle Integration von `icf-tool` in den Spannungsatlas.
> Bei Konflikten gilt folgende Priorität:
> 1. MASTERPLAN.md (kanonische Produktdefinition)
> 2. docs/ux-ui-blaupause.md (UX/UI-Spezifikation)
> 3. Dieses Dokument (Integrationskonzept)

## 1. Ziel der Integration

Die Integration soll den ICF-Output nicht in Spannungsatlas-Deutungen übersetzen, sondern als strukturierte Vorinformation für nachträgliche Reflexion nutzbar machen.

Der ICF-Output dient dabei als:
- Kontextquelle
- Importmaterial für Fallrekonstruktion
- Ausgangspunkt für pädagogische Reflexion
- Anker für spätere Verdichtung

Nicht Ziel ist:
- automatische Bedürfnisbestimmung
- automatische Determinantenbestimmung
- automatische Deutung
- automatische Profilbildung

## 2. Grundsatz

ICF und Spannungsatlas arbeiten auf unterschiedlichen Ebenen:

- `icf-tool` liefert strukturierte Einschätzungen, Bewertungen und Notizen
- `spannungsatlas` trennt Beobachtung, Deutung, Gegen-Deutung, Unsicherheit, Spannungsrelation und Revision

Daraus folgt:

**ICF-Output ist Importmaterial, nicht Produktwahrheit.**

## 3. Produktregel

Importierte ICF-Daten dürfen im Spannungsatlas nur als **externe Assessment-Referenz** oder als **vom Nutzer bestätigter Vorbefüllungsinhalt** erscheinen.

Es gilt:

- Kein ICF-Code ist identisch mit einem Bedürfnis.
- Kein ICF-Wert ist identisch mit einem Evidenztyp.
- Keine ICF-Notiz darf ungeprüft als Beobachtung übernommen werden.
- Importierte Inhalte müssen als Quelle sichtbar bleiben.

## 4. Was aus dem ICF-Export importiert werden kann

### 4.1 Kontextdaten

Folgende Felder können als Kontext- oder Kopfbereich eines Falls vorbefüllt werden:

- `metadata.activity`
- `metadata.personName`
- `metadata.personRef`
- `metadata.personImpression`
- `metadata.personDiagnosis`
- `metadata.personOther`

Regel:
Diese Felder sind Kontext, nicht automatisch Beobachtung. Insbesondere `metadata.personImpression` und `metadata.personDiagnosis` sind stark interpretationsgeladen. Sie gelten als sekundärer Kontext und dürfen weder als direkte Beobachtung noch als unhinterfragte Deutungsvorgabe behandelt werden.

### 4.2 Bewertungsdaten

Jeder `rating`-Eintrag enthält typischerweise:

- `code`
- `title`
- `value`
- `note`

Diese Daten können im Spannungsatlas als **Importkarte** angezeigt werden.

## 5. Importlogik

Der Import erfolgt nicht als stiller Datentransfer, sondern als Assistent.

### 5.1 Import-Assistent

Der Assistent durchläuft folgende Schritte:

1. ICF-JSON laden
2. Metadaten prüfen
3. Ratings als Karten darstellen
4. pro Rating Auswahl anbieten:
   - als Kontext übernehmen
   - als Beobachtungsrohstoff vormerken
   - als Reflexionsanker vormerken
   - ignorieren
5. danach Wechsel in den regulären Spannungsatlas-Reflexionsraum

### 5.2 Beobachtungsregel

Wenn eine ICF-Notiz übernommen wird, muss der Nutzer entscheiden:

- ist diese Formulierung rein beobachtungsnah?
- enthält sie bereits Deutung?
- muss sie in Beobachtung und Deutung getrennt werden?

Die Kamera-Regel des Spannungsatlas bleibt voll gültig.

## 6. UX-Folgen

Die Integration ergänzt die bestehende UX um eine vorgeschaltete Import-Ebene.

### 6.1 Neuer Einstiegspunkt

Zusätzlicher Startpfad im Dashboard:

- Neuer Fall
- Neuer Fall aus ICF-Export

### 6.2 Neue Zwischenansicht: Importprüfung

Zwischen Import und Reflexionsraum liegt eine Prüfoberfläche mit:

- Metadatenblock
- Liste der Ratings
- Importkarten pro Rating
- Auswahlfeldern für Übernahmeart
- Hinweis auf nicht automatische Deutung

### 6.3 Übergang in den Reflexionsraum

Nach Abschluss des Imports wechselt der Nutzer in den normalen Flow:

1. Situation
2. Beobachtung
3. Explorationsraum
4. Deutung
5. Gegen-Deutung
6. Unsicherheit
7. Spannungsnetz
8. Vergleich / Drift / Profil

Die Importdaten bleiben sichtbar als externe Quelle, aber nicht als autoritativer Wahrheitsanker.

## 7. UI-Prinzipien der Importstrecke

- Keine stille Übernahme interpretativer Inhalte
- Jede fremde Aussage bleibt als Quelle markiert
- Ratings werden als Karten, nicht als Roh-JSON dargestellt
- Importierte Notizen können aufgeteilt werden in:
  - beobachtungsnah
  - interpretativ
  - unklar
- Der Nutzer bleibt der Deutende

## 8. Datenmodell-Erweiterung

Für die Integration wird ein separates Referenzobjekt empfohlen:

```ts
interface ExternalAssessmentReference {
  source: "icf-tool";
  importedAt: string;
  assessmentVersion?: string;
  metadata?: {
    activity?: string;
    personName?: string;
    personRef?: string;
    personImpression?: string;
    personDiagnosis?: string;
    personOther?: string;
  };
  ratings: ExternalAssessmentRating[];
}

interface ExternalAssessmentRating {
  code: string;
  title?: string;
  value: number;
  note?: string;
  selectedUsage?: "context" | "observation_seed" | "reflection_anchor" | "ignored";
}
```

Dieses Objekt ist bewusst getrennt von Beobachtung, Deutung und Unsicherheit. Je nach `selectedUsage` werden importierte Inhalte entweder im Fallkontext sichtbar gemacht oder als überprüfbare Vorbefüllung in nachfolgende Arbeitsschritte eingespeist. Auch in vorbefüllter Form bleiben sie als externe Quelle markiert und sind nicht automatisch eine Beobachtung oder Deutung.

## 9. Semantische Schutzregeln
- ICF bleibt ICF; Spannungsatlas bleibt Spannungsatlas.
- Kein automatisches Bedürfnismapping aus ICF-Codes.
- Kein automatisches Determinantenmapping aus ICF-Codes.
- Kein automatischer Transfer von ICF-Werten in Spannungsprofilstärke.
- Importierte Daten sind Reflexionshilfe, nicht Entscheidungsersatz.

## 10. Spätere Ausbaustufen

Später möglich:
- Import-History
- mehrere externe Assessment-Quellen
- manuelle Mappingtabellen von ICF-Bereichen zu Explorationsclustern
- Vergleich von ICF-Verlauf und Spannungsatlas-Verlauf

Nicht zulässig:
- automatische Menschentypisierung aus ICF-Daten
- automatische finale Deutung
- automatisches Spannungsprofil allein aus Assessmentdaten

## 11. Qualitätskriterien

Die Integration ist gelungen, wenn:
- der Import Doppeldokumentation reduziert
- ICF-Daten sauber anschlussfähig werden
- der Spannungsatlas seine Reflexionsdisziplin behält
- Beobachtung und Deutung nicht vermischt werden
- der Explorationsraum sinnvoll geöffnet wird
- der Nutzer mehr sieht, ohne weniger selbst zu denken
