// Script/Config for directus extension building and surpressing specific logs.
// https://github.com/directus/directus/discussions/24673
// Wir haben puppeteer in directus zum laufen gebracht. Allerdings wurde dann beim builden des plugins warnings angezeigt, dass "puppeteer-core" nicht "gut" ist. Es nutzt "this" und das mochte directus nicht.
// Daher wurden eklige warnings angezeigt. Diese Warnings von "puppeteer-core" und "yargs" werden hiermit gefiltert.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Store the original console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Override console.warn to filter specific warnings
console.warn = message => {
  if (typeof message === 'string' && (message.includes('puppeteer-core') || message.includes('yargs')) && message.includes("The 'this' keyword is equivalent to 'undefined' at the top level of an ES module")) {
    return; // Suppress Puppeteer & Yargs 'this' warnings
  }

  originalConsoleWarn(message); // Log other warnings normally
};

// Override console.error to filter specific errors (if needed)
console.error = message => {
  if (typeof message === 'string' && (message.includes('puppeteer-core') || message.includes('yargs')) && message.includes("The 'this' keyword is equivalent to 'undefined' at the top level of an ES module")) {
    return; // Suppress Puppeteer & Yargs errors if necessary
  }

  originalConsoleError(message); // Log other errors normally
};

/**
 * Resolves deep imports like `repo-depkit-common/src/translations` to their TypeScript source.
 *
 * `repo-depkit-common` ships plain `.ts` files. Its package index resolves through `main`, but a
 * path into the package does not, because the resolver of the extension build does not try `.ts`.
 * Code that is also bundled into the Directus app (the "[Erweitert]" Insights panels) imports such
 * paths on purpose: the package index would pull moment-timezone and friends into the browser.
 *
 * The same goes for `repo-depkit-common-ui`: the module page "Live-Puls" deep-imports the avatar
 * SVG helper, the package index would pull in React Native.
 */
const workspaceDeepImports = (packageName, packageFolder) => {
  const prefix = `${packageName}/`;
  const packageRoot = fileURLToPath(new URL(`../../../../../packages/${packageFolder}/`, import.meta.url));
  return {
    name: `${packageName}-deep-imports`,
    resolveId(source) {
      if (!source.startsWith(prefix)) {
        return null;
      }
      const target = path.join(packageRoot, source.substring(prefix.length));
      for (const candidate of [`${target}.ts`, path.join(target, 'index.ts')]) {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
      return null;
    },
  };
};

/**
 * jsPDF loads html2canvas, DOMPurify and canvg lazily for `pdf.html()` and SVG support. The page
 * export panel only places ready-made images (`pdf.addImage`), so these optional dependencies are
 * replaced by an empty module instead of being inlined into the app bundle (~400 KB).
 */
const jsPdfOptionalDependencies = () => {
  const optionalDependencies = new Set(['html2canvas', 'dompurify', 'canvg']);
  const stubId = '\0jspdf-optional-dependency-stub';
  return {
    name: 'jspdf-optional-dependencies',
    resolveId(source, importer) {
      if (optionalDependencies.has(source) && importer?.includes(`${path.sep}jspdf${path.sep}`)) {
        return stubId;
      }
      return null;
    },
    load(id) {
      return id === stubId ? 'export default undefined;' : null;
    },
  };
};

/**
 * Writes the commit the bundle is built from into `src/bundle-health-endpoint/BuildInfo.ts`, so
 * `GET /rocket-meals-bundle-health` shows which code runs on a server.
 *
 * Not the current HEAD, but the last commit that changed the build input: otherwise the `dist`
 * would change on every push to `master`, also when only an app changed. Needs the full history
 * (CI checks out with `fetch-depth: 0`). Without git the placeholders stay and the endpoint reports `null`.
 */
const buildInfo = () => {
  const repoRoot = fileURLToPath(new URL('../../../../../', import.meta.url));
  const bundleFolder = 'apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle';
  const buildInputs = [bundleFolder, `:(exclude)${bundleFolder}/dist`, 'packages/common', 'packages/common-ui', 'yarn.lock'];
  const readCommit = () => {
    try {
      const [commit = '', date = ''] = execFileSync('git', ['log', '-1', '--format=%H%n%cI', '--', ...buildInputs], { cwd: repoRoot, encoding: 'utf8' }).trim().split('\n');
      return { commit, date };
    } catch (error) {
      originalConsoleWarn(`build-info: could not read the git commit, the health endpoint reports null: ${error}`);
      return { commit: '', date: '' };
    }
  };
  const info = readCommit();
  const placeholders = {
    __ROCKET_MEALS_BUILD_SOURCE_COMMIT__: info.commit,
    __ROCKET_MEALS_BUILD_SOURCE_COMMIT_DATE__: info.date,
  };
  return {
    name: 'rocket-meals-build-info',
    transform(code, id) {
      if (!id.endsWith(path.join('bundle-health-endpoint', 'BuildInfo.ts'))) {
        return null;
      }
      return Object.entries(placeholders).reduce((result, [placeholder, value]) => result.split(placeholder).join(value), code);
    },
  };
};

export default {
  plugins: [buildInfo(), workspaceDeepImports('repo-depkit-common', 'common'), workspaceDeepImports('repo-depkit-common-ui', 'common-ui'), jsPdfOptionalDependencies()],
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED' && warning.loc?.file && (warning.loc.file.includes('puppeteer-core') || warning.loc.file.includes('yargs'))) {
      return; // Suppress Puppeteer & Yargs 'this' warnings
    }
    warn(warning); // Show other warnings normally
  },
};
