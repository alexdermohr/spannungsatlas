import type { Case } from '$domain/types.js';
import { renderCaseAsMarkdown } from '$lib/services/case-report.js';
import { serializeCases } from '$lib/export/case-export.js';

export const MD_EXPORT_START = '<!-- SPANNUNGSATLAS_EXPORT_START -->';
export const MD_EXPORT_END = '<!-- SPANNUNGSATLAS_EXPORT_END -->';

export function exportCasesAsMarkdown(cases: readonly Case[], appVersion: string, embedJson = true): string {
  const report = cases.map((c) => renderCaseAsMarkdown(c)).join('\n\n---\n\n');
  if (!embedJson) return report;

  const json = serializeCases(cases, appVersion);
  return `${report}\n\n${MD_EXPORT_START}\n\
\`\`\`json\n${json}\n\`\`\`\n${MD_EXPORT_END}\n`;
}
