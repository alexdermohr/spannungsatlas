import type { Case } from '$domain/types.js';
import { renderCaseAsMarkdown } from '$lib/services/case-report.js';
import { serializeCases } from '$lib/export/case-export.js';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function exportCasesAsHtml(cases: readonly Case[], appVersion: string, embedJson = true): string {
  const reports = cases.map((c) => `<article><pre>${escapeHtml(renderCaseAsMarkdown(c))}</pre></article>`).join('\n');
  const embedded = embedJson
    ? `\n<script type="application/json" id="spannungsatlas-data">\n${escapeHtml(serializeCases(cases, appVersion))}\n</script>`
    : '';

  return `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>Spannungsatlas Export</title></head>
<body>
<h1>Spannungsatlas Export</h1>
${reports}
${embedded}
</body>
</html>`;
}
