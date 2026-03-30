import type { EvidenceType, ParticipantRole } from '$domain/types.js';

export const roleLabels: Record<ParticipantRole, string> = {
  primary: 'Primär',
  secondary: 'Sekundär',
  staff: 'Fachkraft',
  contextual: 'Kontextuell'
};

export const evidenceLabels: Record<EvidenceType, string> = {
  observational: 'Beobachtungsnah',
  derived: 'Abgeleitet',
  speculative: 'Spekulativ'
};
