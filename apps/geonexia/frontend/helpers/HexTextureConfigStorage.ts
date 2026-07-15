import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import { AnchorOverrideFields } from './AnchorOverrideFields';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TextureSpriteAnchorOverride = AnchorOverrideFields;

export type HexTextureConfigState = Record<string, TextureSpriteAnchorOverride>;

// ─── Persistence ─────────────────────────────────────────────────────────────

const HEX_TEXTURE_CONFIG_KEY = 'geonexia-hex-texture-config.json';

/**
 * Persist hex texture config (sprite anchor overrides) to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveHexTextureConfig(config: HexTextureConfigState): Promise<void> {
	try {
		await setStorageItem(HEX_TEXTURE_CONFIG_KEY, JSON.stringify(config));
	} catch (err) {
		console.warn('[HexTextureConfigStorage] Failed to save hex texture config:', err);
	}
}

/**
 * Load hex texture config from disk.
 * Returns an empty object when the file does not exist or cannot be parsed.
 */
export async function loadHexTextureConfig(): Promise<HexTextureConfigState> {
	try {
		const raw = await getStorageItem(HEX_TEXTURE_CONFIG_KEY);
		if (raw === null) return {};
		return JSON.parse(raw) as HexTextureConfigState;
	} catch {
		return {};
	}
}
