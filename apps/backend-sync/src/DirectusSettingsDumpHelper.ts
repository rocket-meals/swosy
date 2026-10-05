import fs from 'node:fs';

/**
 * Settings fields that hold secrets. They must never end up in the git dump, so they are removed
 * from the pulled settings (and thus never pushed either - directus-sync only updates fields that
 * are present in the dump).
 */
export const SECRET_SETTINGS_FIELDS = ['ai_openai_api_key', 'ai_anthropic_api_key', 'ai_google_api_key', 'ai_openai_compatible_api_key', 'ai_openai_compatible_headers'];

/**
 * Modules that must always be enabled in the module bar: the schema pull workflow downloads the
 * TypeScript types from /admin/generate-types.
 */
export const REQUIRED_ENABLED_MODULE_IDS = ['generate-types'];

export type ModuleBarEntry = { type: string; id: string; enabled?: boolean; [key: string]: unknown };

/**
 * Removes duplicate module bar entries (same type and id, the first one wins) and makes sure the
 * required modules exist and are enabled.
 */
export function normalizeModuleBar(moduleBar: ModuleBarEntry[], requiredEnabledModuleIds: string[] = REQUIRED_ENABLED_MODULE_IDS): ModuleBarEntry[] {
  const seen = new Set<string>();
  const result: ModuleBarEntry[] = [];
  for (const entry of moduleBar) {
    const key = `${entry.type}:${entry.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(requiredEnabledModuleIds.includes(entry.id) && entry.type === 'module' ? { ...entry, enabled: true } : entry);
  }
  for (const id of requiredEnabledModuleIds) {
    if (!seen.has(`module:${id}`)) {
      result.push({ type: 'module', id, enabled: true });
    }
  }
  return result;
}

/**
 * Merges the overwrite items field by field over the pulled items (matched by index). Fields that
 * are not in the overwrite file keep the pulled value, so new Directus settings (e.g. the project
 * owner) are not lost on every pull.
 */
export function mergeOverwriteItems(pulledItems: unknown, overwriteItems: unknown): unknown {
  if (!Array.isArray(pulledItems) || !Array.isArray(overwriteItems)) {
    return overwriteItems;
  }
  return overwriteItems.map((overwriteItem, index) => {
    const pulledItem = pulledItems[index];
    if (isPlainObject(pulledItem) && isPlainObject(overwriteItem)) {
      return { ...pulledItem, ...overwriteItem };
    }
    return overwriteItem;
  });
}

/**
 * Cleans the settings dump file in place: removes secret fields and normalizes the module bar.
 * Returns the normalized module bar (or null if the dump has none).
 */
export function cleanSettingsDumpFile(settingsFilePath: string): ModuleBarEntry[] | null {
  if (!fs.existsSync(settingsFilePath)) {
    return null;
  }
  const items = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (!Array.isArray(items)) {
    return null;
  }
  let moduleBar: ModuleBarEntry[] | null = null;
  for (const item of items) {
    if (!isPlainObject(item)) {
      continue;
    }
    for (const field of SECRET_SETTINGS_FIELDS) {
      delete item[field];
    }
    if (Array.isArray(item.module_bar)) {
      item.module_bar = normalizeModuleBar(item.module_bar as ModuleBarEntry[]);
      moduleBar = item.module_bar as ModuleBarEntry[];
    }
  }
  fs.writeFileSync(settingsFilePath, JSON.stringify(items, null, 2) + '\n');
  return moduleBar;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
