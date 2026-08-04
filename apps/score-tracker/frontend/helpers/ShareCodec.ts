import { CompressionHelper } from 'repo-depkit-common';
import type { Friend } from './FriendsStorage';
import { parseFriendsValue } from './FriendsStorage';
import type { GameHistoryEntry, GameHistoryPlayerEntry } from './GameHistoryStorage';
import type { GamePreset } from './GameRules';
import { gameTypeToPreset, parseGamePresetValue } from './GameRules';
import type { GameType } from './GameTypesStorage';

// ─── The shared export schema ─────────────────────────────────────────────────
//
// Every clipboard export of the app (a whole Partie, one or more Spiele, a
// friends list) uses the same envelope, so any import surface can pick out
// exactly the sections it cares about: importing a Partie creates its Spiel
// and Freunde along the way, while the games screen only reads `games` and the
// friends screen only reads `friends` from the very same string. Sections are
// all optional, which keeps the schema extensible.

export type ShareBundle = {
	type: typeof SHARE_BUNDLE_TYPE;
	version: 1;
	/** Shareable game templates. `id` is transport-only: the exporting device's
	 *  game-type id, so `matches` in the same bundle can reference their game -
	 *  it is never imported as-is (the importer resolves games by name). */
	games?: SharedGame[];
	friends?: Friend[];
	/** Archived matches (Partien). `gameTypeId`/`friendId` reference the
	 *  exporting device's ids and are remapped on import (see ShareImportPlan). */
	matches?: GameHistoryEntry[];
};

export type SharedGame = GamePreset & { id?: string };

export const SHARE_BUNDLE_TYPE = 'score-tracker-export';

/** Prefix of a compressed export string, so pasted text is recognizable for what it is. */
export const SHARE_STRING_PREFIX = 'SCORE-TRACKER-V1:';

// ─── Building bundles ─────────────────────────────────────────────────────────

/**
 * Bundle one Partie for sharing: the match itself, its Spiel as a template
 * (when it was played as one) and the roster entries of every participating
 * friend - everything a receiving device needs to add the Partie to its own
 * collection, whether or not it already knows the game or the players.
 */
export function buildMatchShareBundle(params: {
	entry: GameHistoryEntry;
	gameType?: GameType;
	friends: Friend[];
}): ShareBundle {
	const { entry, gameType, friends } = params;
	const participatingFriendIds = new Set(
		entry.players.map((player) => player.friendId).filter((id): id is string => !!id),
	);
	return {
		type: SHARE_BUNDLE_TYPE,
		version: 1,
		games: gameType ? [{ ...gameTypeToPreset(gameType), id: gameType.id }] : [],
		friends: friends.filter((friend) => participatingFriendIds.has(friend.id)),
		matches: [entry],
	};
}

/** Bundle game templates for sharing (the "Spiel exportieren" flows). */
export function buildGamesShareBundle(gameTypes: GameType[]): ShareBundle {
	return {
		type: SHARE_BUNDLE_TYPE,
		version: 1,
		games: gameTypes.map((gameType) => ({ ...gameTypeToPreset(gameType), id: gameType.id })),
	};
}

/** Bundle friends for sharing (the "Freunde exportieren" flows). */
export function buildFriendsShareBundle(friends: Friend[]): ShareBundle {
	return { type: SHARE_BUNDLE_TYPE, version: 1, friends };
}

// ─── Encoding ─────────────────────────────────────────────────────────────────

/** Serialize a bundle into the compact, prefixed clipboard string. */
export function encodeShareBundle(bundle: ShareBundle): string {
	return SHARE_STRING_PREFIX + CompressionHelper.compressToBase64(JSON.stringify(bundle));
}

// ─── Decoding / validation ────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSharedMatchPlayer(value: unknown): GameHistoryPlayerEntry | null {
	if (!isRecord(value)) return null;
	if (typeof value.playerId !== 'string' || value.playerId === '') return null;
	if (typeof value.name !== 'string') return null;
	if (typeof value.color !== 'string') return null;
	if (value.friendId !== undefined && typeof value.friendId !== 'string') return null;
	return value as unknown as GameHistoryPlayerEntry;
}

/**
 * Structural validation of one shared match. Deliberately checks only the
 * fields the app relies on (id, players, scores) and passes optional detail
 * fields (rounds, categories, times) through - the readers of a
 * `GameHistoryEntry` already treat all of those as optional.
 */
export function parseSharedMatchValue(value: unknown): GameHistoryEntry | null {
	if (!isRecord(value)) return null;
	if (typeof value.id !== 'string' || value.id === '') return null;
	if (typeof value.endedAt !== 'number') return null;
	if (typeof value.roundsCount !== 'number') return null;
	if (!Array.isArray(value.players) || value.players.length === 0) return null;
	if (!value.players.every((player) => parseSharedMatchPlayer(player) !== null)) return null;
	if (!isRecord(value.finalScores)) return null;
	if (!Object.values(value.finalScores).every((score) => typeof score === 'number')) return null;
	if (value.gameTypeId !== undefined && typeof value.gameTypeId !== 'string') return null;
	if (value.rounds !== undefined && !Array.isArray(value.rounds)) return null;
	return value as unknown as GameHistoryEntry;
}

function parseShareBundleValue(value: unknown): ShareBundle | null {
	if (!isRecord(value)) return null;
	if (value.type !== SHARE_BUNDLE_TYPE) return null;
	if (typeof value.version !== 'number') return null;

	const bundle: ShareBundle = { type: SHARE_BUNDLE_TYPE, version: 1 };

	if (value.games !== undefined) {
		if (!Array.isArray(value.games)) return null;
		const games: SharedGame[] = [];
		for (const raw of value.games) {
			const preset = parseGamePresetValue(raw);
			if (!preset) return null;
			const id = isRecord(raw) && typeof raw.id === 'string' ? raw.id : undefined;
			games.push({ ...preset, id });
		}
		bundle.games = games;
	}

	if (value.friends !== undefined) {
		if (!Array.isArray(value.friends)) return null;
		if (value.friends.length > 0) {
			const friends = parseFriendsValue(value.friends);
			if (!friends) return null;
			bundle.friends = friends;
		} else {
			bundle.friends = [];
		}
	}

	if (value.matches !== undefined) {
		if (!Array.isArray(value.matches)) return null;
		const matches: GameHistoryEntry[] = [];
		for (const raw of value.matches) {
			const match = parseSharedMatchValue(raw);
			if (!match) return null;
			matches.push(match);
		}
		bundle.matches = matches;
	}

	return bundle;
}

/**
 * Parse any pasted/clipboard text into a `ShareBundle`. Accepts, in order:
 * the compressed prefixed export string, the plain envelope JSON, and the
 * legacy export formats from before the envelope existed (a bare `Friend[]`
 * array, a single `GamePreset` object, an array of presets) - those are
 * wrapped into an equivalent bundle so every import surface only has to deal
 * with one shape. Returns `null` if the text is none of these.
 */
export function decodeShareText(text: string): ShareBundle | null {
	const trimmed = text.trim();
	if (trimmed === '') return null;

	if (trimmed.startsWith(SHARE_STRING_PREFIX)) {
		const json = CompressionHelper.decompressFromBase64(trimmed.slice(SHARE_STRING_PREFIX.length));
		if (json === null) return null;
		try {
			return parseShareBundleValue(JSON.parse(json));
		} catch {
			return null;
		}
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		return null;
	}

	const bundle = parseShareBundleValue(parsed);
	if (bundle) return bundle;

	// Legacy: a bare friends array ("Freunde exportieren" of older versions).
	const friends = parseFriendsValue(parsed);
	if (friends) return { type: SHARE_BUNDLE_TYPE, version: 1, friends };

	// Legacy: a single game preset ("Spiel exportieren" of older versions).
	const preset = parseGamePresetValue(parsed);
	if (preset) return { type: SHARE_BUNDLE_TYPE, version: 1, games: [preset] };

	// Legacy: an array of game presets ("Alle Spiele exportieren" of older versions).
	if (Array.isArray(parsed) && parsed.length > 0) {
		const games: SharedGame[] = [];
		for (const raw of parsed) {
			const parsedPreset = parseGamePresetValue(raw);
			if (!parsedPreset) return null;
			games.push(parsedPreset);
		}
		return { type: SHARE_BUNDLE_TYPE, version: 1, games };
	}

	return null;
}
