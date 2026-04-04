import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseImportToDocument } from './case-import.js';

describe('case-import', () => {
  describe('extractJsonFromHtml', () => {
    // Basic DOMParser mock to keep tests lightweight
    const originalDOMParser = global.DOMParser;


    beforeAll(() => {
      // @ts-ignore
      global.DOMParser = class DOMParser {
        parseFromString(html: string, type: string) {
          return {
            querySelector: (selector: string) => {
              if (selector === 'script#spannungsatlas-data') {
                if (!html.includes('id="spannungsatlas-data"') && !html.includes("id='spannungsatlas-data'")) {
                  return null;
                }
                const matchType = html.match(/type=["']([^"']+)["']/);
                const typeVal = matchType ? matchType[1] : null;

                let contentVal = '';
                const scriptStart = html.indexOf('<script');
                const scriptEnd = html.indexOf('</script>', scriptStart);
                if (scriptStart !== -1 && scriptEnd !== -1) {
                   const startTagEnd = html.indexOf('>', scriptStart);
                   contentVal = html.substring(startTagEnd + 1, scriptEnd);
                }

                return {
                  getAttribute: (attr: string) => attr === 'type' ? typeVal : null,
                  textContent: contentVal
                };
              }
              return null;
            }
          };
        }
      };
    });

    afterAll(() => {
      global.DOMParser = originalDOMParser;
    });

    it('finds data when attributes are in different order', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <script id="spannungsatlas-data" type="application/json">
            {"format": "spannungsatlas-case-export", "version": "1.0", "appVersion": "0.1.0", "exportedAt": "2024-01-01T00:00:00.000Z", "cases": []}
          </script>
        </body>
        </html>
      `;
      const doc = parseImportToDocument(html, 'html');
      expect(doc.format).toBe('spannungsatlas-case-export');
      expect(doc.cases).toEqual([]);
    });

    it('throws correct error when script is missing', () => {
      const html = `<html><body></body></html>`;
      expect(() => parseImportToDocument(html, 'html')).toThrow('HTML-Import: Script-Tag mit Exportdaten nicht gefunden.');
    });

    it('throws correct error when type is not application/json', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <script id="spannungsatlas-data" type="text/javascript">
            {"format": "spannungsatlas-case-export", "version": "1.0", "appVersion": "0.1.0", "exportedAt": "2024-01-01T00:00:00.000Z", "cases": []}
          </script>
        </body>
        </html>
      `;
      expect(() => parseImportToDocument(html, 'html')).toThrow('HTML-Import: Script-Tag mit Exportdaten nicht gefunden.');
    });
  });
});
