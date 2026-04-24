import type {
  CatalogSelection,
  EvidenceType,
  PerspectiveDraftContent,
  PerspectiveDraftObservation,
  PerspectiveDraftInterpretation,
  UncertaintyLevel,
} from '$domain/types.js';

export interface CounterInputRow {
  text: string;
  evidence: EvidenceType;
}

export interface UncertaintyInputRow {
  level: UncertaintyLevel;
  rationale: string;
}

export type CameraInputState = boolean | 'true' | 'false' | 'null' | null | undefined;

function normalizeCameraState(value: CameraInputState): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

export function normalizeObservationInput(input: {
  observationText: string;
  cameraState: CameraInputState;
}): PerspectiveDraftObservation | undefined {
  const text = input.observationText.trim();
  const camera = normalizeCameraState(input.cameraState);

  if (text === '' && camera === undefined) {
    return undefined;
  }

  return {
    ...(text !== '' ? { text } : {}),
    ...(camera !== undefined ? { isCameraDescribable: camera } : {}),
  };
}

export function normalizeInterpretationInput(input: {
  interpretationText: string;
  interpretationEvidence: EvidenceType;
}): PerspectiveDraftInterpretation | undefined {
  const text = input.interpretationText.trim();
  if (text === '') return undefined;

  return {
    text,
    evidenceType: input.interpretationEvidence,
  };
}

export function normalizeCounterRows(rows: readonly CounterInputRow[]): {
  text: string;
  evidenceType: EvidenceType;
}[] {
  return rows
    .map((row) => ({ text: row.text.trim(), evidenceType: row.evidence }))
    .filter((row) => row.text !== '');
}

export function normalizeUncertaintyRows(
  rows: readonly UncertaintyInputRow[]
): { level: UncertaintyLevel; rationale: string }[] {
  return rows
    .map((row) => ({ level: row.level, rationale: row.rationale.trim() }))
    .filter((row): row is { level: UncertaintyLevel; rationale: string } => row.rationale !== '');
}

export function buildPerspectiveDraftContent(input: {
  observationText: string;
  cameraState: CameraInputState;
  interpretationText: string;
  interpretationEvidence: EvidenceType;
  counterRows: readonly CounterInputRow[];
  uncertaintyRows: readonly UncertaintyInputRow[];
  selectedNeeds?: readonly CatalogSelection[];
  selectedDeterminants?: readonly CatalogSelection[];
}): PerspectiveDraftContent {
  const observation = normalizeObservationInput({
    observationText: input.observationText,
    cameraState: input.cameraState,
  });
  const interpretation = normalizeInterpretationInput({
    interpretationText: input.interpretationText,
    interpretationEvidence: input.interpretationEvidence,
  });
  const counterInterpretations = normalizeCounterRows(input.counterRows);
  const uncertainties = normalizeUncertaintyRows(input.uncertaintyRows);

  return {
    ...(observation ? { observation } : {}),
    ...(interpretation ? { interpretation } : {}),
    ...(counterInterpretations.length > 0 ? { counterInterpretations } : {}),
    ...(uncertainties.length > 0 ? { uncertainties } : {}),
    ...(input.selectedNeeds && input.selectedNeeds.length > 0 ? { selectedNeeds: [...input.selectedNeeds] } : {}),
    ...(input.selectedDeterminants && input.selectedDeterminants.length > 0
      ? { selectedDeterminants: [...input.selectedDeterminants] }
      : {}),
  };
}
