import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StoreAppMetadata } from 'repo-depkit-common';

// Loads a ground truth module (e.g. apps/frontend/app/store-metadata.ts). Every app in
// the monorepo manages its own store metadata; the module just has to export a
// getStoreMetadata(): StoreAppMetadata[] function.

export const REPO_ROOT = path.resolve(__dirname, '..', '..');

export function loadStoreMetadataModule(modulePath: string): StoreAppMetadata[] {
  const absolutePath = path.isAbsolute(modulePath) ? modulePath : path.resolve(REPO_ROOT, modulePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Ground-Truth-Modul nicht gefunden: ${absolutePath}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const loaded = require(absolutePath) as { getStoreMetadata?: () => StoreAppMetadata[] };
  if (typeof loaded.getStoreMetadata !== 'function') {
    throw new Error(`${absolutePath} exportiert keine Funktion getStoreMetadata(): StoreAppMetadata[]`);
  }

  const metadata = loaded.getStoreMetadata();
  if (!Array.isArray(metadata) || metadata.length === 0) {
    throw new Error(`${absolutePath}: getStoreMetadata() lieferte keine Einträge.`);
  }
  return metadata;
}

// --app <filter> matches against display name, bundle id and package name.
export function filterStoreMetadata(metadata: StoreAppMetadata[], appFilter: string | undefined): StoreAppMetadata[] {
  if (!appFilter) {
    return metadata;
  }
  const needle = appFilter.toLowerCase();
  const filtered = metadata.filter(entry =>
    [entry.displayName, entry.apple?.bundleId, entry.google?.packageName].some(value => value?.toLowerCase().includes(needle))
  );
  if (filtered.length === 0) {
    throw new Error(`Kein App-Eintrag passt zum Filter "${appFilter}".`);
  }
  return filtered;
}
