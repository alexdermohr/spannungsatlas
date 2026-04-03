import type { Case } from '$domain/types.js';
import { roleLabels, evidenceLabels } from '$lib/ui/labels.js';

export function renderCaseAsMarkdown(caseData: Case): string {
  const parts: string[] = [];

  parts.push('# Fallbericht');

  if (caseData.context) {
    parts.push('## Kontext\n' + caseData.context);
  }

  if (caseData.participants && caseData.participants.length > 0) {
    parts.push('## Beteiligte\n' + caseData.participants.map(p => {
      const roleStr = p.role ? ` (${roleLabels[p.role] ?? p.role})` : '';
      return `- ${p.id}${roleStr}`;
    }).join('\n'));
  }

  if (caseData.observation && caseData.observation.text) {
    let obsText = caseData.observation.text;
    if (caseData.observation.isCameraDescribable) {
      obsText += '\n\n*Anmerkung: kamerabeschreibbar*';
    }
    parts.push('## Beobachtung\n' + obsText);
  }

  const reflection = caseData.currentReflection;
  if (reflection) {
    if (reflection.interpretation && reflection.interpretation.text) {
      const { text, evidenceType } = reflection.interpretation;
      const typeStr = evidenceType ? ` [${evidenceLabels[evidenceType] ?? evidenceType}]` : '';
      parts.push(`## Deutung\n${text}${typeStr}`);
    }

    if (reflection.counterInterpretations && reflection.counterInterpretations.length > 0) {
      parts.push('## Gegen-Deutungen\n' + reflection.counterInterpretations.map(c => {
        const typeStr = c.evidenceType ? ` [${evidenceLabels[c.evidenceType] ?? c.evidenceType}]` : '';
        return `- ${c.text}${typeStr}`;
      }).join('\n'));
    }

    if (reflection.uncertainties && reflection.uncertainties.length > 0) {
      parts.push('## Unsicherheiten\n' + reflection.uncertainties.map(u => {
        return `- Stufe ${u.level}/5: ${u.rationale}`;
      }).join('\n'));
    }
  }

  return parts.join('\n\n');
}
