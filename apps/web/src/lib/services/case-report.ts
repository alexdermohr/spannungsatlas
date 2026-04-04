import type { Case, CaseParticipant, Interpretation, Uncertainty } from '$domain/types.js';

function normalizeText(value: string | undefined | null): string {
  return (value ?? '').trim();
}

function renderParticipantRole(role: string): string {
  if (role === 'primary') return 'Primär';
  if (role === 'secondary') return 'Sekundär';
  if (role === 'contextual') return 'Kontextuell';
  if (role === 'staff') return 'Fachkraft';
  return role;
}

function renderParticipants(participants: readonly CaseParticipant[]): string[] {
  return [...participants]
    .map((participant) => ({
      id: normalizeText(participant.id),
      role: normalizeText(participant.role)
    }))
    .filter((participant) => participant.id.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id, 'de-DE') || a.role.localeCompare(b.role, 'de-DE'))
    .map((participant) => (
      participant.role.length > 0
        ? `- ${participant.id} (${renderParticipantRole(participant.role)})`
        : `- ${participant.id}`
    ));
}

function renderCounterInterpretations(counterInterpretations: readonly Interpretation[]): string[] {
  return [...counterInterpretations]
    .map((counter) => ({
      text: normalizeText(counter.text),
      evidenceType: counter.evidenceType
    }))
    .filter((counter) => counter.text.length > 0)
    .sort((a, b) => a.text.localeCompare(b.text, 'de-DE') || a.evidenceType.localeCompare(b.evidenceType, 'de-DE'))
    .map((counter) => `- ${counter.text}`);
}

function renderUncertainties(uncertainties: readonly Uncertainty[]): string[] {
  return [...uncertainties]
    .map((uncertainty) => ({
      level: uncertainty.level,
      rationale: normalizeText(uncertainty.rationale)
    }))
    .sort((a, b) => a.level - b.level || a.rationale.localeCompare(b.rationale, 'de-DE'))
    .map((uncertainty) => {
      if (uncertainty.rationale.length === 0) {
        return `- Stufe ${uncertainty.level}`;
      }
      return `- Stufe ${uncertainty.level}: ${uncertainty.rationale}`;
    });
}

export function renderCaseAsMarkdown(caseData: Case): string {
  const sections: string[] = ['# Fallbericht'];
  const participantsSource = Array.isArray(caseData.participants) ? caseData.participants : [];
  const observationText = normalizeText(caseData.observation?.text);
  const currentReflection = caseData.currentReflection;

  // NOTE:
  // evidenceType und isCameraDescribable werden im Markdown-Export bewusst nicht abgebildet.
  // Entscheidung: aktueller Report ist minimal-lesbar, nicht epistemisch vollständig.
  // Erweiterung erfordert separate Produktentscheidung.

  const context = normalizeText(caseData.context);
  if (context.length > 0) {
    sections.push('## Kontext', context);
  }

  const participants = renderParticipants(participantsSource);
  if (participants.length > 0) {
    sections.push('## Beteiligte', participants.join('\n'));
  }

  if (observationText.length > 0) {
    sections.push('## Beobachtung', observationText);
  }

  if (!currentReflection) {
    return `${sections.join('\n\n')}\n`;
  }

  const interpretation = normalizeText(currentReflection.interpretation?.text);
  if (interpretation.length > 0) {
    sections.push('## Deutung', interpretation);
  }

  const counterInterpretations = renderCounterInterpretations(
    Array.isArray(currentReflection.counterInterpretations) ? currentReflection.counterInterpretations : []
  );
  if (counterInterpretations.length > 0) {
    sections.push('## Gegen-Deutungen', counterInterpretations.join('\n'));
  }

  const uncertainties = renderUncertainties(
    Array.isArray(currentReflection.uncertainties) ? currentReflection.uncertainties : []
  );
  if (uncertainties.length > 0) {
    sections.push('## Unsicherheiten', uncertainties.join('\n'));
  }

  return `${sections.join('\n\n')}\n`;
}
