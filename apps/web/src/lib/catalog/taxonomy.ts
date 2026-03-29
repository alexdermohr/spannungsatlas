/**
 * V1 Minimal Taxonomy — derived from MASTERPLAN.md §9
 *
 * Four strictly separated layers:
 *   - Bedürfnis  = what the person strives for
 *   - Determinante = what amplifies or dampens the drive
 *   - Ausdrucksform = how the pressure manifests
 *   - Umweltreaktion = how the environment responds
 *
 * These layers MUST NOT be conflated (MASTERPLAN §9.1 Trennregel).
 */

/** A single entry in the V1 taxonomy (MASTERPLAN §9). */
export interface TaxonomyItem {
  /** Unique machine-readable identifier, e.g. 'need-security'. */
  readonly id: string;
  /** Human-readable short name displayed in the catalog. */
  readonly label: string;
  /** Explanatory text describing the concept in pedagogical context. */
  readonly description: string;
  /** Illustrative examples — not exhaustive, intended as reflection prompts. */
  readonly examples?: readonly string[];
}

export interface TaxonomyCategory {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly items: readonly TaxonomyItem[];
}

// ---------------------------------------------------------------------------
// Bedürfnisse – Minimalcluster V1 (MASTERPLAN §9.2)
// ---------------------------------------------------------------------------

const needs: TaxonomyCategory = {
  id: 'needs',
  label: 'Bedürfnisse',
  description: 'Worauf der Mensch drängt — grundlegende Bedürfnisse als Bezugsrahmen für die Reflexion.',
  items: [
    {
      id: 'need-security',
      label: 'Sicherheit und Schutz',
      description:
        'Das Bedürfnis nach physischer und psychischer Sicherheit, nach einem geschützten Rahmen und Vorhersagbarkeit von Abläufen.',
      examples: [
        'Suche nach festen Routinen',
        'Rückzug bei unvorhersehbaren Veränderungen',
        'Angst vor Sanktionen'
      ]
    },
    {
      id: 'need-belonging',
      label: 'Bindung und Zugehörigkeit',
      description:
        'Das Bedürfnis, Teil einer Gruppe zu sein, wahrgenommen und angenommen zu werden — unabhängig von Leistung.',
      examples: [
        'Protest bei Ausschluss',
        'Klammern an Bezugspersonen',
        'Eifersucht bei Zuwendung an andere'
      ]
    },
    {
      id: 'need-autonomy',
      label: 'Autonomie und Einfluss',
      description:
        'Das Bedürfnis nach Selbstwirksamkeit, Mitgestaltung und dem Gefühl, Einfluss auf die eigene Situation zu haben.',
      examples: [
        'Verweigerung bei Fremdbestimmung',
        'Eigenständige Lösungsversuche',
        'Gegenkontrolle bei Machtverlust'
      ]
    },
    {
      id: 'need-recognition',
      label: 'Anerkennung und Selbstwert',
      description:
        'Das Bedürfnis, als Person wertgeschätzt zu werden, sichtbar zu sein und eigene Kompetenzen anerkannt zu bekommen.',
      examples: [
        'Angabe und Übertreibung',
        'Entwertung anderer',
        'Rückzug nach Kritik'
      ]
    },
    {
      id: 'need-orientation',
      label: 'Orientierung und Vorhersagbarkeit',
      description:
        'Das Bedürfnis, sich in Abläufen, Regeln und sozialen Erwartungen zurechtzufinden — zu wissen, was kommt und was gilt.',
      examples: [
        'Wiederholtes Nachfragen',
        'Regelbefolgung oder Regeltest',
        'Irritation bei Planänderungen'
      ]
    },
    {
      id: 'need-justice',
      label: 'Gerechtigkeit und Fairness',
      description:
        'Das Bedürfnis nach gleichmäßiger Behandlung, nachvollziehbaren Regeln und dem Empfinden, fair behandelt zu werden.',
      examples: [
        'Protest bei Ungleichbehandlung',
        'Verweigerung bei empfundener Ungerechtigkeit',
        'Einforderung gleicher Regeln für alle'
      ]
    }
  ]
};

// ---------------------------------------------------------------------------
// Determinanten – Minimalcluster V1 (MASTERPLAN §9.3)
// ---------------------------------------------------------------------------

const determinants: TaxonomyCategory = {
  id: 'determinants',
  label: 'Determinanten',
  description: 'Was den Drang verstärkt oder dämpft — Kontextfaktoren, die pädagogische Situationen prägen.',
  items: [
    {
      id: 'det-time-pressure',
      label: 'Zeitdruck oder Überlastung',
      description:
        'Situationen mit engem Zeitrahmen, Aufgabendichte oder kumulierter Belastung, die Handlungsspielräume einschränken.',
      examples: ['Hektik beim Übergang', 'Aufgabenstau', 'Erschöpfung nach langem Tag']
    },
    {
      id: 'det-ambiguity',
      label: 'Unklarheit oder Ambiguität',
      description:
        'Situationen, in denen Regeln, Erwartungen oder Rollen unklar oder widersprüchlich sind.',
      examples: ['Widersprüchliche Anweisungen', 'Neue Umgebung', 'Unklare Zuständigkeiten']
    },
    {
      id: 'det-loss-of-control',
      label: 'Kontrollverlust',
      description:
        'Momente, in denen die beobachtete Person den Einfluss auf die Situation verliert oder zu verlieren glaubt.',
      examples: ['Wegnahme von Gegenständen', 'Entscheidung durch andere', 'Hilflosigkeit bei Übergriffen']
    },
    {
      id: 'det-shame-risk',
      label: 'Beschämungsrisiko',
      description:
        'Situationen mit erhöhtem Risiko für Scham, Bloßstellung oder Gesichtsverlust.',
      examples: ['Korrektur vor der Gruppe', 'Leistungsvergleich', 'Offenlegung von Nichtwissen']
    },
    {
      id: 'det-public-context',
      label: 'Öffentliche Situation',
      description:
        'Interaktionen, die unter Beobachtung anderer stattfinden und dadurch Druck erzeugen.',
      examples: ['Konflikte im Gruppenraum', 'Ermahnung vor Peers', 'Präsentation vor Fremden']
    },
    {
      id: 'det-competition',
      label: 'Konkurrenz oder Vergleich',
      description:
        'Kontexte, in denen Vergleich, Wettbewerb oder Rangfolge eine Rolle spielen.',
      examples: ['Verteilung knapper Ressourcen', 'Spielwettbewerbe', 'Vergleich mit Geschwistern']
    },
    {
      id: 'det-fatigue',
      label: 'Müdigkeit oder Erschöpfung',
      description:
        'Physische oder psychische Erschöpfung, die Regulationskapazität reduziert.',
      examples: ['Schlafmangel', 'Reizüberflutung', 'Emotionale Erschöpfung']
    },
    {
      id: 'det-relationship-tension',
      label: 'Beziehungsanspannung',
      description:
        'Spannungen in relevanten Beziehungen, die das Verhalten in der beobachteten Situation beeinflussen können.',
      examples: ['Konflikte mit Bezugsperson', 'Loyalitätskonflikte', 'Trennungserleben']
    }
  ]
};

// ---------------------------------------------------------------------------
// Ausdrucksformen – Minimalcluster V1 (MASTERPLAN §9.4)
// ---------------------------------------------------------------------------

const expressionForms: TaxonomyCategory = {
  id: 'expression-forms',
  label: 'Ausdrucksformen',
  description: 'Wie sich der Druck zeigt — beobachtbare Verhaltensweisen in Spannungssituationen.',
  items: [
    {
      id: 'expr-withdrawal',
      label: 'Rückzug',
      description: 'Physischer oder emotionaler Rückzug aus der Situation.',
      examples: ['Verlassen des Raums', 'Verstummen', 'Abwenden']
    },
    {
      id: 'expr-counter-control',
      label: 'Gegenkontrolle',
      description: 'Versuch, die Kontrolle über die Situation zurückzugewinnen oder zu behalten.',
      examples: ['Verweigerung', 'Regelverletzung', 'Provokation']
    },
    {
      id: 'expr-protest',
      label: 'Protest',
      description: 'Offener Widerspruch oder aktive Ablehnung der Situation.',
      examples: ['Lautstarker Einspruch', 'Empörung', 'Anklage']
    },
    {
      id: 'expr-vocalization',
      label: 'Lautwerden',
      description: 'Erhöhte Lautstärke oder stimmliche Intensität als Ausdruck von Anspannung.',
      examples: ['Schreien', 'Lautstarkes Weinen', 'Rufen']
    },
    {
      id: 'expr-negotiation',
      label: 'Verhandlung',
      description: 'Versuch, die Situation durch Argumentation oder Aushandlung zu verändern.',
      examples: ['Bitten', 'Kompromissvorschläge', 'Abmachungen einfordern']
    },
    {
      id: 'expr-avoidance',
      label: 'Vermeidung',
      description: 'Ausweichen vor der Situation, bevor es zur Konfrontation kommt.',
      examples: ['Themenwechsel', 'Ablenkung', 'Nicht-Erscheinen']
    },
    {
      id: 'expr-freezing',
      label: 'Erstarren',
      description: 'Reaktionsunfähigkeit oder Handlungsblockade in der Situation.',
      examples: ['Stehenbleiben', 'Schweigen bei Ansprache', 'Leerer Blick']
    },
    {
      id: 'expr-help-seeking',
      label: 'Hilfesuche',
      description: 'Aktives Suchen nach Unterstützung durch andere Personen.',
      examples: ['Bezugsperson ansprechen', 'Um Hilfe bitten', 'An andere wenden']
    }
  ]
};

// ---------------------------------------------------------------------------
// Umweltreaktionen – Minimalcluster V1 (MASTERPLAN §9.5)
// ---------------------------------------------------------------------------

const environmentReactions: TaxonomyCategory = {
  id: 'environment-reactions',
  label: 'Umweltreaktionen',
  description: 'Was das Umfeld daraufhin tut — Reaktionen des sozialen Kontexts auf die beobachtete Situation.',
  items: [
    {
      id: 'env-calming',
      label: 'Beruhigung',
      description: 'Das Umfeld versucht, die Situation durch beruhigende Intervention zu deeskalieren.',
      examples: ['Ruhiger Tonfall', 'Körperliche Nähe anbieten', 'Ablenkung']
    },
    {
      id: 'env-correction',
      label: 'Korrektur',
      description: 'Das Umfeld weist auf erwünschtes Verhalten hin oder korrigiert das beobachtete Verhalten.',
      examples: ['Ermahnung', 'Verhaltenshinweis', 'Regelerinnerung']
    },
    {
      id: 'env-limit',
      label: 'Begrenzung',
      description: 'Das Umfeld setzt eine Grenze oder schränkt Handlungsspielraum ein.',
      examples: ['Räumliche Trennung', 'Entzug von Privilegien', 'Stopp-Signal']
    },
    {
      id: 'env-negotiation',
      label: 'Verhandlung',
      description: 'Das Umfeld geht in den Dialog und sucht gemeinsam nach einer Lösung.',
      examples: ['Kompromissangebot', 'Gemeinsame Regelklärung', 'Perspektivwechsel anregen']
    },
    {
      id: 'env-withdrawal',
      label: 'Rückzug des Umfelds',
      description: 'Das Umfeld zieht sich aus der Situation zurück oder entzieht Aufmerksamkeit.',
      examples: ['Ignorieren', 'Sich abwenden', 'Gespräch abbrechen']
    },
    {
      id: 'env-support',
      label: 'Unterstützung',
      description: 'Das Umfeld bietet aktive Hilfe oder emotionale Unterstützung an.',
      examples: ['Hilfe anbieten', 'Zuhören', 'Begleitung']
    },
    {
      id: 'env-sanction',
      label: 'Sanktion',
      description: 'Das Umfeld reagiert mit einer Konsequenz oder Strafe.',
      examples: ['Ausschluss', 'Strafarbeit', 'Entzug von Teilnahme']
    },
    {
      id: 'env-ignoring',
      label: 'Ignorieren',
      description: 'Das Umfeld nimmt die Situation bewusst oder unbewusst nicht wahr oder reagiert nicht.',
      examples: ['Keine Reaktion', 'Wegsehen', 'Situation übergehen']
    }
  ]
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const taxonomy: readonly TaxonomyCategory[] = [
  needs,
  determinants,
  expressionForms,
  environmentReactions
];
