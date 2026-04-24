import type { EvidenceType, UncertaintyLevel } from '$domain/types.js';

export interface CounterRow {
  text: string;
  evidence: EvidenceType;
}

export interface UncertaintyRow {
  level: UncertaintyLevel;
  rationale: string;
}

export type CameraStateStr = 'null' | 'true' | 'false';