import type { Friend } from './FriendsStorage';
import type { GameHistoryEntry } from './GameHistoryStorage';
import type { GameType } from './GameTypesStorage';
import type { ShareBundle, SharedGame } from './ShareCodec';

// ─── Import planning ──────────────────────────────────────────────────────────
//
// Turning a decoded `ShareBundle` into local state is not a plain merge: a
// Spiel in the bundle may already exist locally (matched by name) with a
// different version, and a Freund may exist under the same name but another
// id - both cases are decisions only the user can make. `buildImportPlan`
// therefore classifies everything up front; the import UI renders the
// conflicts as questions and executes the plan with the collected choices
// (see components/ShareImportContent).

/** Which sections of a bundle an import surface consumes. */
export type ImportMode = 'all' | 'games' | 'friends';

export type GameImportResolution =
	/** No local game of that name - the game will be created from the template. */
	| { kind: 'create'; game: SharedGame }
	/** A local game matches by name and version - it is simply used as-is. */
	| { kind: 'existing'; game: SharedGame; localGameType: GameType }
	/** A local game matches by name but the versions differ - the user decides
	 *  whether the local game is updated to the imported definition. */
	| { kind: 'versionConflict'; game: SharedGame; localGameType: GameType; importedVersion: number; localVersion: number };

export type FriendImportResolution =
	/** The same friend (same id) already exists - fields are merged onto it. */
	| { kind: 'existing'; friend: Friend; localFriend: Friend }
	/** Unknown id and unknown name - imported as a new friend. */
	| { kind: 'new'; friend: Friend }
	/** A local friend has the same name but another id - the user decides
	 *  whether that's the same person or someone new. */
	| { kind: 'nameConflict'; friend: Friend; localFriend: Friend };

export type ImportPlan = {
	games: GameImportResolution[];
	friends: FriendImportResolution[];
	matches: GameHistoryEntry[];
};

/** The user's answer to a `versionConflict`. */
export type GameConflictChoice = 'updateLocal' | 'keepLocal';

/** The user's answer to a `nameConflict`. */
export type FriendConflictChoice = 'samePerson' | 'newPerson' | 'newPersonRenamed';

function normalizeName(name: string): string {
	return name.trim().toLowerCase();
}

/**
 * Classify everything in the bundle against the local collections. `mode`
 * narrows what is consumed: the games screen imports only the Spiele out of
 * (e.g.) a full Partie export, the friends screen only the Freunde - and only
 * a full import ('all') brings the Partien plus everything they need along.
 */
export function buildImportPlan(
	bundle: ShareBundle,
	params: { localGameTypes: GameType[]; localFriends: Friend[]; mode: ImportMode },
): ImportPlan {
	const { localGameTypes, localFriends, mode } = params;

	const games: GameImportResolution[] = [];
	if (mode !== 'friends') {
		for (const game of bundle.games ?? []) {
			const localGameType = localGameTypes.find((candidate) => normalizeName(candidate.name) === normalizeName(game.name));
			if (!localGameType) {
				games.push({ kind: 'create', game });
				continue;
			}
			const importedVersion = game.version ?? 1;
			const localVersion = localGameType.version ?? 1;
			if (importedVersion === localVersion) {
				games.push({ kind: 'existing', game, localGameType });
			} else {
				games.push({ kind: 'versionConflict', game, localGameType, importedVersion, localVersion });
			}
		}
	}

	const friends: FriendImportResolution[] = [];
	if (mode !== 'games') {
		for (const friend of bundle.friends ?? []) {
			const byId = localFriends.find((candidate) => candidate.id === friend.id);
			if (byId) {
				friends.push({ kind: 'existing', friend, localFriend: byId });
				continue;
			}
			const byName = localFriends.find((candidate) => normalizeName(candidate.name) === normalizeName(friend.name));
			if (byName) {
				friends.push({ kind: 'nameConflict', friend, localFriend: byName });
			} else {
				friends.push({ kind: 'new', friend });
			}
		}
	}

	const matches = mode === 'all' ? bundle.matches ?? [] : [];

	return { games, friends, matches };
}

/**
 * A name for a "same name, but a different person" friend import that doesn't
 * collide with any local friend: `Anna` becomes `Anna (2)`, then `Anna (3)`…
 */
export function dedupedFriendName(name: string, localFriends: Friend[]): string {
	const taken = new Set(localFriends.map((friend) => normalizeName(friend.name)));
	for (let counter = 2; ; counter++) {
		const candidate = `${name.trim()} (${counter})`;
		if (!taken.has(normalizeName(candidate))) return candidate;
	}
}

/**
 * Rewrite a shared match's device-specific references to the local ones the
 * import resolved: its `gameTypeId` to the local Spiel it was matched
 * with/created as, and every player's `friendId` to the local friend chosen
 * for it. An id without a mapping is kept as-is - for friends that is
 * deliberate, so importing the friends later (e.g. from the same string on
 * the friends screen) re-links the participants retroactively.
 */
export function remapSharedMatch(
	entry: GameHistoryEntry,
	params: { gameIdMap: Record<string, string>; friendIdMap: Record<string, string> },
): GameHistoryEntry {
	const { gameIdMap, friendIdMap } = params;
	return {
		...entry,
		gameTypeId: entry.gameTypeId ? gameIdMap[entry.gameTypeId] ?? entry.gameTypeId : undefined,
		players: entry.players.map((player) => ({
			...player,
			friendId: player.friendId ? friendIdMap[player.friendId] ?? player.friendId : undefined,
		})),
	};
}
