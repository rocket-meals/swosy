import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
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

/**
 * `dist/app.js` läuft im Browser, in der Directus-Oberfläche. Importiert es ein Node-Modul
 * (`assert`, `net`, …), kann der Browser es nicht auflösen und Directus lädt **keine** App-Extension
 * des Bundles: Modul „Rocket Meals“ und Panels fehlen dann. Passiert ist das, als `LivePulseHelper`
 * eine Konstante aus `BackendUsageEventHelper` importiert hat, das Redis (`ioredis`) mitzieht.
 */
const DIST_APP_PATH = path.join(__dirname, '..', '..', 'dist', 'app.js');

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

  (existsSync(DIST_APP_PATH) ? it : it.skip)('app part imports no Node built-ins', () => {
    const source = readFileSync(DIST_APP_PATH, 'utf8');
    const imported = [...source.matchAll(/(?:from|import)\s*["']([^"'./][^"']*)["']/g)].map(match => match[1]!);
    const builtins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));
    expect(imported.filter(name => builtins.has(name))).toEqual([]);
  });
});
