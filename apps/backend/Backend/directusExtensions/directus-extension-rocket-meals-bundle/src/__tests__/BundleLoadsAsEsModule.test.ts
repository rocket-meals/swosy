import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Directus lädt `dist/api.js` als ES-Modul. Wirft das Modul schon beim Laden, fehlen auf dem
 * Server stillschweigend alle Hooks und Endpoints des Bundles (Endpoints antworten dann mit
 * ROUTE_NOT_FOUND). Genau das ist mit einem statischen Feld passiert, das `__dirname` benutzt
 * hat – das gibt es in ES-Modulen nicht.
 *
 * Jest selbst läuft als CommonJS und kennt `__dirname`, deshalb wird das Bundle hier in einem
 * eigenen Node-Prozess als ES-Modul geladen, so wie Directus es tut.
 */
const DIST_API_PATH = path.join(__dirname, '..', '..', 'dist', 'api.js');

describe('extension bundle', () => {
  const distExists = existsSync(DIST_API_PATH);

  (distExists ? it : it.skip)('loads as ES module without throwing', () => {
    const script = `
      const bundle = await import(${JSON.stringify(pathToFileURL(DIST_API_PATH).href)});
      const exported = bundle.default ?? bundle;
      console.log(JSON.stringify({ endpoints: (exported.endpoints ?? []).map((e) => e.name) }));
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
      timeout: 120000,
    });

    expect(result.stderr).not.toContain('Error');
    expect(result.status).toBe(0);
    const lastLine = result.stdout.trim().split('\n').pop() ?? '{}';
    const { endpoints } = JSON.parse(lastLine) as { endpoints: string[] };
    expect(endpoints).toContain('guest-account-endpoint');
    expect(endpoints).toContain('bundle-health-endpoint');
  });
});
