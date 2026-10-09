import fs from 'node:fs';

/**
 * Settings fields that hold secrets. They must never end up in the git dump, so they are removed
 * from the pulled settings (and thus never pushed either - directus-sync only updates fields that
 * are present in the dump).
 */
export const SECRET_SETTINGS_FIELDS = ['ai_openai_api_key', 'ai_anthropic_api_key', 'ai_google_api_key', 'ai_openai_compatible_api_key', 'ai_openai_compatible_headers'];

/**
 * Settings fields that belong to a single instance (name, color, URLs). They are removed from the
 * pulled settings as well, otherwise the values of the test system are pushed to every fork.
 */
export const INSTANCE_SPECIFIC_SETTINGS_FIELDS = [
  'project_name',
  'project_color',
  'project_descriptor',
  'visual_editor_urls',
  // The OpenAI-compatible provider is configured per server (Settings → AI). Pushing the dump value
  // (usually null) would wipe it, so it is only set when the ROCKET_MEALS_AI_OPENAI_COMPATIBLE_* envs exist.
  'ai_openai_compatible_name',
  'ai_openai_compatible_base_url',
  'ai_openai_compatible_models',
];

const SETTINGS_FIELDS_NOT_IN_DUMP = [...SECRET_SETTINGS_FIELDS, ...INSTANCE_SPECIFIC_SETTINGS_FIELDS];

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
 * Cleans the settings dump file in place: removes secret and instance specific fields and normalizes the module bar.
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
    for (const field of SETTINGS_FIELDS_NOT_IN_DUMP) {
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

/** Env variable per OpenAI-compatible provider settings field. */
export const AI_OPENAI_COMPATIBLE_ENV_KEYS = {
  name: 'ROCKET_MEALS_AI_OPENAI_COMPATIBLE_NAME',
  baseUrl: 'ROCKET_MEALS_AI_OPENAI_COMPATIBLE_BASE_URL',
  apiKey: 'ROCKET_MEALS_AI_OPENAI_COMPATIBLE_API_KEY',
  models: 'ROCKET_MEALS_AI_OPENAI_COMPATIBLE_MODELS',
  headers: 'ROCKET_MEALS_AI_OPENAI_COMPATIBLE_HEADERS',
} as const;

/**
 * Builds the settings patch for the OpenAI-compatible provider from the envs. Only envs that are set
 * (and not empty) end up in the patch, all other fields keep the value configured in Directus.
 * Returns null when no env is set.
 *
 * - MODELS: comma separated model ids (`model-a,model-b`) or the raw Directus JSON list.
 * - HEADERS: JSON object (`{"X-Header":"value"}`) or the raw Directus JSON list of `{ header, value }`.
 */
export function buildAiOpenAiCompatibleSettingsFromEnv(env: Record<string, string | undefined>): Record<string, unknown> | null {
  const read = (key: string): string | undefined => {
    const value = env[key]?.trim();
    return value ? value : undefined;
  };
  const patch: Record<string, unknown> = {};
  const name = read(AI_OPENAI_COMPATIBLE_ENV_KEYS.name);
  if (name !== undefined) patch.ai_openai_compatible_name = name;
  const baseUrl = read(AI_OPENAI_COMPATIBLE_ENV_KEYS.baseUrl);
  if (baseUrl !== undefined) patch.ai_openai_compatible_base_url = baseUrl;
  const apiKey = read(AI_OPENAI_COMPATIBLE_ENV_KEYS.apiKey);
  if (apiKey !== undefined) patch.ai_openai_compatible_api_key = apiKey;
  const models = read(AI_OPENAI_COMPATIBLE_ENV_KEYS.models);
  if (models !== undefined) patch.ai_openai_compatible_models = parseModelsEnv(models);
  const headers = read(AI_OPENAI_COMPATIBLE_ENV_KEYS.headers);
  if (headers !== undefined) patch.ai_openai_compatible_headers = parseHeadersEnv(headers);
  return Object.keys(patch).length > 0 ? patch : null;
}

function parseModelsEnv(value: string): unknown {
  if (value.startsWith('[')) {
    return JSON.parse(value);
  }
  return value
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)
    .map(id => ({ id, name: id }));
}

function parseHeadersEnv(value: string): unknown {
  const parsed: unknown = JSON.parse(value);
  if (isPlainObject(parsed)) {
    return Object.entries(parsed).map(([header, headerValue]) => ({ header, value: String(headerValue) }));
  }
  return parsed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
