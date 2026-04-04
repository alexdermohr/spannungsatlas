import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseImportToDocument } from './case-import.js';

describe('case-import', () => {
  describe('extractJsonFromHtml', () => {

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

    it('finds data when type has different casing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <script id="spannungsatlas-data" type="Application/JSON">
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

    describe('fallback logic', () => {
      let originalDOMParser: typeof globalThis.DOMParser | undefined;
      let wasDeleted = false;

      beforeAll(() => {
        if (Reflect.has(globalThis, 'DOMParser')) {
           originalDOMParser = globalThis.DOMParser;
           wasDeleted = Reflect.deleteProperty(globalThis, 'DOMParser');
        }
      });

      afterAll(() => {
        if (wasDeleted && originalDOMParser !== undefined) {
           globalThis.DOMParser = originalDOMParser;
        }
      });

      it('finds data when id is before type', () => {
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

      it('finds data when type is before id', () => {
        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <script type="application/json" id="spannungsatlas-data">
              {"format": "spannungsatlas-case-export", "version": "1.0", "appVersion": "0.1.0", "exportedAt": "2024-01-01T00:00:00.000Z", "cases": []}
            </script>
          </body>
          </html>
        `;
        const doc = parseImportToDocument(html, 'html');
        expect(doc.format).toBe('spannungsatlas-case-export');
        expect(doc.cases).toEqual([]);
      });

      it('fails gracefully if type is incorrect', () => {
        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <script type="text/javascript" id="spannungsatlas-data">
              {"format": "spannungsatlas-case-export", "version": "1.0", "appVersion": "0.1.0", "exportedAt": "2024-01-01T00:00:00.000Z", "cases": []}
            </script>
          </body>
          </html>
        `;
        expect(() => parseImportToDocument(html, 'html')).toThrow('HTML-Import: Script-Tag mit Exportdaten nicht gefunden.');
      });
    });
  });
});
