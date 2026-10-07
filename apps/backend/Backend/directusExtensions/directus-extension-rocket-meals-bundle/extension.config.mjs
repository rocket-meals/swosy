// Script/Config for directus extension building and surpressing specific logs.
// https://github.com/directus/directus/discussions/24673
// Wir haben puppeteer in directus zum laufen gebracht. Allerdings wurde dann beim builden des plugins warnings angezeigt, dass "puppeteer-core" nicht "gut" ist. Es nutzt "this" und das mochte directus nicht.
// Daher wurden eklige warnings angezeigt. Diese Warnings von "puppeteer-core" und "yargs" werden hiermit gefiltert.

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
  const optionalDependencies = ['html2canvas', 'dompurify', 'canvg'];
  const stubId = '\0jspdf-optional-dependency-stub';
  return {
    name: 'jspdf-optional-dependencies',
    resolveId(source, importer) {
      if (optionalDependencies.includes(source) && importer && importer.includes(`${path.sep}jspdf${path.sep}`)) {
        return stubId;
      }
      return null;
    },
    load(id) {
      return id === stubId ? 'export default undefined;' : null;
    },
  };
};

export default {
  plugins: [workspaceDeepImports('repo-depkit-common', 'common'), workspaceDeepImports('repo-depkit-common-ui', 'common-ui'), jsPdfOptionalDependencies()],
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED' && warning.loc?.file && (warning.loc.file.includes('puppeteer-core') || warning.loc.file.includes('yargs'))) {
      return; // Suppress Puppeteer & Yargs 'this' warnings
    }
    warn(warning); // Show other warnings normally
  },
};
