import { File, Paths } from 'expo-file-system';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpriteAnchorOverride = {
	anchorX: number;
	anchorY: number;
};

export type BillboardConfigState = Record<number, SpriteAnchorOverride>;

// ─── Persistence ─────────────────────────────────────────────────────────────

function getBillboardConfigFile(): File {
	return new File(Paths.document, 'geonexia-billboard-config.json');
}

/**
 * Persist billboard config (sprite anchor overrides) to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveBillboardConfig(config: BillboardConfigState): void {
	try {
		getBillboardConfigFile().write(JSON.stringify(config));
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
		const file = getBillboardConfigFile();
		if (!file.exists) return {};
		const content = await file.text();
		return JSON.parse(content) as BillboardConfigState;
	} catch {
		return {};
	}
}
