import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlayerInformation = {
	/**
	 * H3 cell index of the tile the player has set as their home.
	 * Null when no home has been set yet.
	 */
	homeHexTile: string | null;
};

// ─── Persistence ─────────────────────────────────────────────────────────────

const PLAYER_INFORMATION_KEY = 'geonexia-player-information.json';

/**
 * Persist player information to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function savePlayerInformation(info: PlayerInformation): Promise<void> {
	try {
		await setStorageItem(PLAYER_INFORMATION_KEY, JSON.stringify(info));
	} catch (err) {
		console.warn('[PlayerInformationStorage] Failed to save player information:', err);
	}
}

/**
 * Load player information from disk.
 * Returns default values when the file does not exist or cannot be parsed.
 */
export async function loadPlayerInformation(): Promise<PlayerInformation> {
	try {
		const raw = await getStorageItem(PLAYER_INFORMATION_KEY);
		if (raw === null) return { homeHexTile: null };
		const parsed = JSON.parse(raw) as Partial<PlayerInformation>;
		return {
			homeHexTile: typeof parsed.homeHexTile === 'string' ? parsed.homeHexTile : null,
		};
	} catch {
		return { homeHexTile: null };
	}
}
