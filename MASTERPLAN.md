# Spannungsatlas – Kanonischer Produktmasterplan

Status: verbindliches Produktdokument für dieses Repository  
Primärer Nutzungskontext: pädagogische Praxis  
Produktcharakter: Dokumentations-, Reflexions- und Vordiagnostiksystem

## 1. Produktdefinition

Spannungsatlas ist ein pädagogisches System zur Dokumentation, Reflexion und reflexiven Vordiagnostik. Es erfasst Fälle, revidierbare Spannungsprofile von Personen und Konstellationsprofile von Situationen im Zeitverlauf, um wiederkehrende Spannungsdynamiken sichtbar und hinterfragbar zu machen.

Der Produktkern lautet:

- Menschen sollen über Zeit verständlicher werden, ohne auf ein Etikett reduziert zu werden.
- Personenprofile sind erlaubt und nötig, aber nur als revidierbare Arbeitsprofile.
- Konstellationsanalyse ist Pflichtgegengewicht gegen vorschnelle Wesenserklärung.
- Beobachtung, Deutung, Widerspruch und Revision bleiben sichtbar.

Spannungsatlas ist **kein** klinisches Diagnosetool, kein starres Persönlichkeitsinventar und kein Defizitregister.

## 2. Produktinvarianten

Die folgenden Invarianten sind **MUSS**-Regeln. Sie dürfen in späteren Konzepten, UI-Entwürfen oder Implementierungen nicht verletzt werden.

1. **MUSS:** Beobachtung und Deutung werden strikt getrennt dokumentiert.
2. **MUSS:** Personenprofile sind revidierbare Arbeitsprofile, keine Wahrheitsurteile über Personen.
3. **MUSS:** Kein Spannungsprofil ohne Widerspruchsfeld, Gegenbelege und Revisionsdatum.
4. **MUSS:** Kein starker Profileintrag darf aus einem Einzelfall abgeleitet werden.
5. **MUSS:** Konstellationsanalyse ist Pflichtgegengewicht zur Profilverdichtung.
6. **MUSS:** Unsicherheit, Evidenzlage und Datenlücken bleiben sichtbar.
7. **MUSS:** Personennahe und konstellationsnahe Muster werden getrennt markiert.
8. **MUSS:** Sprache bleibt funktional, beobachtungsnah und nicht essenzialisierend.
9. **MUSS:** Profilverfall wird sichtbar, wenn Verdichtungen veralten oder nicht mehr gestützt sind.
10. **MUSS:** Rollen und Berechtigungen begrenzen, wer sehen, verdichten, revidieren und exportieren darf.

Die folgenden Leitplanken sind **SOLL**:

- **SOLL:** Das System soll Kontinuität über Zeit schaffen, ohne Einzelfälle zu überstimmen.
- **SOLL:** Teams sollen differenzierter urteilen, nicht schneller verfestigen.
- **SOLL:** Interventionen sollen nach kurzfristiger Wirkung, langfristiger Wirkung und Nebenwirkung reflektierbar sein.

## 3. Kanonische Kernobjekte

Nur diese drei Objekte sind kanonische Top-Level-Objekte des Produkts:

### 3.1 Fall

Eine konkrete Szene oder Beobachtungseinheit.

**MUSS-Felder in V1**

- Person
- Datum oder Zeitraum
- Kontext/Ort
- Beobachtung
- Deutung/Hypothese
- Gegenhypothese
- Unsicherheitsmarkierung

**SOLL-Felder in V1**

- Auslöser
- Beteiligte
- vermutetes Bedürfnis
- relevante Determinanten
- Ausdrucksform
- Umweltreaktion
- Intervention
- Outcome

### 3.2 Spannungsprofil

Aggregierte, revidierbare Arbeitsverdichtung zu einer Person über mehrere Fälle und Zeitpunkte.

Ein **starker Profileintrag** ist eine Verdichtung, die als wiederkehrendes Muster oder belastbare pädagogische Arbeitshypothese formuliert wird. Er setzt mehrere Fälle über Zeit, mehrere Kontexte oder eine belastbare Mehrquellenlage voraus. Einzelereignisse dürfen nur als schwacher oder spekulativer Hinweis eingehen.

**MUSS-Felder in V1**

- verdichtete Musterbeschreibung
- häufige Bedürfnisdrucke
- häufige Determinanten
- typische Ausdrucksformen
- typische Entlastungsbedingungen
- Gegenbelege
- Evidenzstufe
- Revisionsdatum

**SOLL-Felder später**

- Profilhistorie
- Profilverfall
- offene Datenlücken
- Trennung personennah vs. konstellationsnah auf Eintragebene

### 3.3 Konstellationsprofil

Aggregierte Situations- oder Beziehungskonstellation, die wiederkehrend Druck verstärkt oder entlastet.

Es ist ein kanonisches Top-Level-Objekt des Produkts.

**MUSS in V1 nicht als eigenständiger vollwertiger Workflow vorliegen.** V1 bildet Konstellationsbezug zunächst implizit über Fälle und textliche Konstellationshinweise ab. Ein eigenständiges Konstellationsprofil mit eigener Verdichtungslogik ist **SPÄTER** vorgesehen.

**SOLL-Felder später**

- Triggerlagen
- soziale Settings
- Machtasymmetrien
- Publikumseffekte
- Eskalationspfade
- Entlastungspfade

Bedürfnisse, Determinanten, Ausdrucksformen und Umweltreaktionen sind keine eigenen Top-Level-Objekte, sondern Unteraspekte von Fall, Spannungsprofil und Konstellationsprofil.

## 4. Nicht verhandelbare Leitidee

Die zentrale Produktlogik lautet:

**Person + Bedürfnisdruck + Determinanten + Situation + Umweltreaktion + Zeitverlauf = pädagogisch relevante Spannungsdynamik**

Spannungsatlas beantwortet deshalb immer beide Fragen:

- Was zeigt sich bei dieser Person über Zeit wiederholt?
- Unter welchen Bedingungen zeigt es sich?

Pädagogische Qualität entsteht erst aus dem Zusammenspiel von Spannungsprofil und Konstellationsprofil.

Diese Leitidee ist **verbindliche Orientierung**. Konkrete Produktpflichten werden jedoch durch die Invarianten, V1-Grenzen und Schutzmechanismen bestimmt.

## 5. Produktscope V1

### 5.1 V1 umfasst

V1 ist bewusst eng. Es liefert eine belastbare Minimalfassung für pädagogische Praxis.

**MUSS in V1 enthalten sein**

- Personen anlegen
- Fälle anlegen
- Beobachtung und Deutung getrennt erfassen
- Hypothese und Gegenhypothese erfassen
- Unsicherheit markieren
- einfachen Verlauf pro Person anzeigen
- einfaches Spannungsprofil aus mehreren Fällen formulieren
- Gegenbelege und Revisionsdatum im Spannungsprofil führen
- Konstellationsbezug in Fällen textlich oder markierend erfassbar machen, ohne bereits einen eigenständigen Konstellationsprofil-Workflow zu verlangen

**SOLL in V1 enthalten sein**

- einfache Markierung von Auslösern, Bedürfnissen, Determinanten und Umweltreaktionen
- einfache Exportfunktion für Dokumentation
- knapper Überblick je Person mit letzter Revision und offenen Fragen

### 5.2 V1 umfasst nicht

Folgendes liegt **nicht** in V1:

- komplexe Assistenzfunktionen oder KI-gestützte Verdichtung
- ausgebaute Konstellationscluster oder automatische Musterbildung
- tiefe Interventionsintelligenz
- komplexe Visualisierungslandschaft
- automatische Menschentypisierung
- klinische Diagnostik
- starre Scores oder scheingenaue Persönlichkeitswerte

### 5.3 V1-Minimalgrenzen

V1 ist nur dann erfüllt, wenn alle folgenden Minimalgrenzen gelten:

- Ein Fall ist in wenigen Minuten erfassbar.
- Ein Spannungsprofil setzt mehrere Fälle voraus.
- Jedes Spannungsprofil zeigt Gegenbelege und Revisionsdatum.
- Jede Person hat einen einfachen Verlauf über dokumentierte Fälle.
- Konstellationsbezug ist mindestens textlich oder markierend erfassbar.
- Das Konstellationsprofil ist in V1 nur implizit vorbereitet, nicht als eigener vollständiger Workflow umgesetzt.

## 6. Dokumentationsökonomie

Spannungsatlas ist nur tragfähig, wenn Fälle auch unter Zeitdruck dokumentierbar bleiben.

### 6.1 Erfassungsmodi

**MUSS:** V1 unterstützt zwei Modi:

1. **Quick-Capture-Modus** für akute oder knappe Dokumentation  
   Ziel: minimale Eingabelast bei maximaler methodischer Klarheit
2. **Tiefenreflexions-Modus** für Fallbesprechungen, Teamreflexion oder spätere Verdichtung  
   Ziel: differenziertere Deutung, Gegenhypothesen und Verlaufseinordnung

### 6.2 Pflichtfelder vs. optionale Felder

**Quick-Capture MUSS**

- Person
- Datum oder Zeitraum
- Beobachtung
- erste Hypothese
- Gegenhypothese oder offene Leerstelle
- Unsicherheitsmarkierung

**Quick-Capture SOLL optional zulassen**

- Auslöser
- Bedürfniscluster
- Determinantencluster
- Umweltreaktion
- Intervention

**Tiefenreflexion SOLL ergänzen**

- Verlaufseinordnung
- Gegenbelege
- personennah vs. konstellationsnah
- offene Fragen
- Revisionsnotiz

### 6.3 Leitprinzip

**MUSS:** Das System bevorzugt weniger, aber sauber getrennte Eingaben gegenüber umfassender, aber ritualisierter Dokumentation.

## 7. Rollen- und Berechtigungsmodell V1

Personenprofile erzeugen Macht. Diese Macht wird architektonisch geregelt.

### 7.1 Rollen

- **Beobachter**: darf Beobachtungen erfassen, aber keine Profile verdichten
- **Fachkraft**: darf Fälle anlegen und Spannungsprofile vorschlagen
- **Teamleitung**: darf Profile freigeben, revidieren und Exporte auslösen
- **Supervision**: darf reflektieren, kommentieren und Widerspruch eintragen, aber nicht allein finalisieren

### 7.2 Berechtigungsmatrix V1

| Aktion | Beobachter | Fachkraft | Teamleitung | Supervision |
|---|---|---|---|---|
| Fall anlegen | JA | JA | JA | JA |
| Fall bearbeiten | nur eigene | JA | JA | kommentierend |
| Spannungsprofil vorschlagen | NEIN | JA | JA | kommentierend |
| Spannungsprofil freigeben | NEIN | NEIN | JA | NEIN |
| Spannungsprofil revidieren | NEIN | freigabepflichtig | JA | kommentierend |
| Widerspruchseintrag setzen | JA | JA | JA | JA |
| sensible Inhalte sehen | eingeschränkt | eingeschränkt | JA | eingeschränkt |
| Export auslösen | NEIN | freigabepflichtig | JA | NEIN |

### 7.3 Berechtigungsprinzipien

- **MUSS:** Profilfreigabe und Profilrevision dürfen nicht an reine Beobachtungsrechte gekoppelt sein.
- **MUSS:** Widerspruchseinträge dürfen nicht exklusiv auf Leitungsrollen beschränkt sein.
- **MUSS:** Exportrechte sind restriktiver als Leserechte.
- **MUSS:** Ein Spannungsprofil darf in V1 nur freigegeben werden, wenn mehr als ein Fall oder eine belastbare Mehrquellenlage vorliegt.
- **MUSS:** Gegenbelege dürfen bei Freigabe nicht leer bleiben; wenn keine Gegenbelege vorliegen, muss die Leerstelle explizit markiert werden.
- **MUSS:** Revisionsdatum ist Freigabevoraussetzung.

## 8. Kanonische Taxonomie V1

V1 startet mit bewusst begrenzter, aber trennscharfer Taxonomie. Die Taxonomie ist erweiterbar, aber die Kategorien bleiben getrennt.

### 8.1 Trennregel

- **Bedürfnis** = worauf der Mensch drängt
- **Determinante** = was den Drang verstärkt oder dämpft
- **Ausdrucksform** = wie sich der Druck zeigt
- **Umweltreaktion** = was das Umfeld daraufhin tut

Diese vier Ebenen dürfen nicht vermischt werden.

### 8.2 Bedürfnisse – Minimalcluster V1

- Sicherheit und Schutz
- Bindung und Zugehörigkeit
- Autonomie und Einfluss
- Anerkennung und Selbstwert
- Orientierung und Vorhersagbarkeit
- Gerechtigkeit und Fairness

### 8.3 Determinanten – Minimalcluster V1

- Zeitdruck oder Überlastung
- Unklarheit oder Ambiguität
- Kontrollverlust
- Beschämungsrisiko
- öffentliche Situation
- Konkurrenz oder Vergleich
- Müdigkeit oder Erschöpfung
- Beziehungsanspannung

### 8.4 Ausdrucksformen – Minimalcluster V1

- Rückzug
- Gegenkontrolle
- Protest
- Lautwerden
- Verhandlung
- Vermeidung
- Erstarren
- Hilfesuche

### 8.5 Umweltreaktionen – Minimalcluster V1

- Beruhigung
- Korrektur
- Begrenzung
- Verhandlung
- Rückzug des Umfelds
- Unterstützung
- Sanktion
- Ignorieren

### 8.6 Erweiterungsprinzip

- **MUSS:** Erweiterungen bleiben innerhalb der vier Ebenen.
- **SOLL:** Neue Unterkategorien werden nur ergänzt, wenn V1-Begriffe wiederholt nicht ausreichen.
- **KANN:** Spätere Versionen können domänenspezifische Untertaxonomien ergänzen.
- **MUSS:** V1 bevorzugt sparsame Markierungen statt vollständiger taxonomischer Ausdekoration.
- **KANN:** Pro Ebene sind mehrere Markierungen erlaubt, wenn sie für den Fall wirklich relevant sind.

## 9. Schutzmechanismen

Die Schutzmechanismen sind Produktkern, nicht Beiwerk.

### 9.1 Verbindliche Schutzregeln

- **MUSS:** jedes Spannungsprofil hat Evidenzstufe
- **MUSS:** jedes Spannungsprofil hat Gegenbelege
- **MUSS:** jedes Spannungsprofil hat Revisionsdatum
- **MUSS:** jede Verdichtung zeigt Unsicherheit
- **MUSS:** Spekulation wird sichtbar markiert
- **MUSS:** epistemische Leere bleibt explizit benennbar
- **MUSS:** personennah und konstellationsnah werden getrennt markiert

### 9.2 Sprachregeln

Unzulässige Sprache:

- trotzig
- manipulativ
- autoritätsgestört
- sucht Aufmerksamkeit
- ist schamgesteuert
- braucht Kontrolle

Zulässige Richtung:

- zeigt unter Kontrollverlust wiederholt Gegenkontrolle
- reagiert unter Öffentlichkeit plausibel mit Selbstwertschutz
- zeigt in Konkurrenzsituationen erhöhten Drang auf Anerkennung oder Gerechtigkeit
- alternative Deutung: Überforderung / Bindungstest / Ambiguitätsstress

## 10. Ausbaupfade nach V1

Die folgenden Ausbaustufen sind **SPÄTER** und nicht Teil des harten V1-Scope.

### 10.1 Spannungsprofil-Ausbau

- Profilhistorie
- Profilverfallslogik
- offene Datenlücken
- robustere Evidenz- und Widerspruchslogik

### 10.2 Konstellationsanalyse

- eigenständiges Konstellationsprofil
- Triggerkarte
- Eskalationspfade
- Entlastungspfade
- Kontextvergleich

### 10.3 Teammodus

- Teamkommentare
- konkurrierende Hypothesen
- Review-Workflow
- Fallkonferenzmodus

### 10.4 Interventionsintelligenz

- Maßnahmenbibliothek
- Vergleich kurzfristig/langfristig
- Beziehungswirkung
- Entwicklungswirkung
- Nebenwirkungen

### 10.5 Assistenz

- fragt nach Gegenbelegen
- markiert fehlende Daten
- schlägt alternative Deutungen vor
- warnt vor zu harter Verdichtung

Nicht zulässig, auch später nicht:

- automatische Menschentypisierung
- scheinobjektive Charakterurteile

## 11. Qualitätskriterien

Spannungsatlas ist nur dann gut, wenn:

- Personenprofile helfen, ohne festzuschreiben
- Konstellationsanalyse Verdichtung relativiert
- Verlauf stärker zählt als Einzelfall
- Gegenhypothesen tatsächlich genutzt werden
- Teams differenzierter urteilen
- Interventionen präziser reflektiert werden
- Widersprüche sichtbar bleiben
- Sprache funktional statt moralisch bleibt

## 12. Offene Produktfragen

Die folgenden Fragen sind bewusst noch nicht abschließend kanonisiert:

- Datenschutz- und Berechtigungsarchitektur für reale Trägersettings
- konkrete Dokumentationsökonomie im Praxisalltag
- Taxonomie-Tiefe über das Minimalset hinaus
- Sprachregister und gewünschter Fachlichkeitsgrad

Diese Punkte bleiben offen, bis sie durch reale Nutzungsanforderungen, Datenschutzprüfung und Feldfeedback präzisiert werden.
