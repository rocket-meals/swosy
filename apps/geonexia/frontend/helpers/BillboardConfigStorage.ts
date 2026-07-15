import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import { AnchorOverrideFields } from './AnchorOverrideFields';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpriteAnchorOverride = AnchorOverrideFields;

export type BillboardConfigState = Record<number, SpriteAnchorOverride>;

// ─── Persistence ─────────────────────────────────────────────────────────────

const BILLBOARD_CONFIG_KEY = 'geonexia-billboard-config.json';

/**
 * Persist billboard config (sprite anchor overrides) to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveBillboardConfig(config: BillboardConfigState): Promise<void> {
	try {
		await setStorageItem(BILLBOARD_CONFIG_KEY, JSON.stringify(config));
	} catch (err) {
		console.warn('[BillboardConfigStorage] Failed to save billboard config:', err);
	}
}

/**
 * Load billboard config from disk.
 * Returns an empty object when the file does not exist or cannot be parsed.
 */
export async function loadBillboardConfig(): Promise<BillboardConfigState> {
	try {
		const raw = await getStorageItem(BILLBOARD_CONFIG_KEY);
		if (raw === null) return {};
		return JSON.parse(raw) as BillboardConfigState;
	} catch {
		return {};
	}
}
