import type { EvidenceType, UncertaintyLevel, PerspectiveContent } from '$domain/types.js';

export interface PerspectiveFormState {
  observationText: string;
  isCameraDescribable: boolean;
  interpretationText: string;
  interpretationEvidence: EvidenceType;
  counterRows: { text: string; evidence: EvidenceType }[];
  uncertaintyRows: { level: UncertaintyLevel; rationale: string }[];
  draftId: string | null;
  draftCreatedAt: string | null;
  errorMsg: string;
}

export function createEmptyPerspectiveFormState(): PerspectiveFormState {
  return {
    observationText: '',
    isCameraDescribable: false,
    interpretationText: '',
    interpretationEvidence: 'observational',
    counterRows: [{ text: '', evidence: 'observational' }],
    uncertaintyRows: [{ level: 2, rationale: '' }],
    draftId: crypto.randomUUID(),
    draftCreatedAt: null,
    errorMsg: ''
  };
}

export function mapDraftToFormState(draft: any): PerspectiveFormState {
  if (!draft) return createEmptyPerspectiveFormState();

  return {
    draftId: draft.id,
    draftCreatedAt: draft.createdAt || null,
    observationText: draft.content.observation?.text || '',
    isCameraDescribable: draft.content.observation?.isCameraDescribable || false,
    interpretationText: draft.content.interpretation?.text || '',
    interpretationEvidence: draft.content.interpretation?.evidenceType || 'observational',
    counterRows: draft.content.counterInterpretations?.length > 0
      ? draft.content.counterInterpretations.map((c: any) => ({ text: c.text, evidence: c.evidenceType }))
      : [{ text: '', evidence: 'observational' }],
    uncertaintyRows: draft.content.uncertainties?.length > 0
      ? draft.content.uncertainties.map((u: any) => ({ level: u.level, rationale: u.rationale }))
      : [{ level: 2, rationale: '' }],
    errorMsg: ''
  };
}
