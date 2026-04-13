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

export const uncertaintyLabels: Record<0 | 1 | 2 | 3 | 4 | 5, string> = {
  0: '0 (Sicher)',
  1: '1 (Kaum Zweifel)',
  2: '2 (Eher sicher)',
  3: '3 (Mittel)',
  4: '4 (Unsicher)',
  5: '5 (Hoch spekulativ)'
};
