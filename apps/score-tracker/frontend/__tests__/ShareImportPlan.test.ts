// The helpers only need the storage functions from common-ui; mocking the
// package keeps jest away from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import type { Friend } from '../helpers/FriendsStorage';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import type { GameType } from '../helpers/GameTypesStorage';
import type { ShareBundle } from '../helpers/ShareCodec';
import { SHARE_BUNDLE_TYPE } from '../helpers/ShareCodec';
import { buildImportPlan, dedupedFriendName, remapSharedMatch } from '../helpers/ShareImportPlan';

function makeGameType(overrides: Partial<GameType> = {}): GameType {
	return {
		id: 'local-game-1',
		name: 'Flip Seven',
		icon: '🃏',
		imageUrl: null,
		scoringMode: 'highWins',
		maxRounds: null,
		maxScore: 200,
		rules: null,
		categories: null,
		trackScores: true,
		startingPlayerMode: 'fixed',
		version: 1,
		createdAt: 1000,
		...overrides,
	};
}

function makeFriend(overrides: Partial<Friend> = {}): Friend {
	return { id: 'local-friend-1', name: 'Anna', color: '#2563eb', createdAt: 1000, ...overrides };
}

function makeBundle(overrides: Partial<ShareBundle> = {}): ShareBundle {
	return { type: SHARE_BUNDLE_TYPE, version: 1, ...overrides };
}

const sharedGame = { name: 'Flip Seven', icon: '🃏', scoringMode: 'highWins' as const, version: 2, id: 'remote-game-1' };

describe('buildImportPlan - games', () => {
	it('creates a game that does not exist locally', () => {
		const plan = buildImportPlan(makeBundle({ games: [sharedGame] }), { localGameTypes: [], localFriends: [], mode: 'games' });
		expect(plan.games).toEqual([{ kind: 'create', game: sharedGame }]);
	});

	it('matches a local game by name (case-insensitive) and equal version', () => {
		const local = makeGameType({ name: 'flip seven', version: 2 });
		const plan = buildImportPlan(makeBundle({ games: [sharedGame] }), { localGameTypes: [local], localFriends: [], mode: 'games' });
		expect(plan.games[0]).toEqual({ kind: 'existing', game: sharedGame, localGameType: local });
	});

	it('flags a version mismatch as conflict', () => {
		const local = makeGameType({ version: 1 });
		const plan = buildImportPlan(makeBundle({ games: [sharedGame] }), { localGameTypes: [local], localFriends: [], mode: 'games' });
		expect(plan.games[0]).toEqual({
			kind: 'versionConflict',
			game: sharedGame,
			localGameType: local,
			importedVersion: 2,
			localVersion: 1,
		});
	});

	it('treats a missing version as version 1', () => {
		const local = makeGameType({ version: undefined });
		const { version: _ignored, ...gameWithoutVersion } = sharedGame;
		const plan = buildImportPlan(makeBundle({ games: [{ ...gameWithoutVersion }] }), {
			localGameTypes: [local],
			localFriends: [],
			mode: 'games',
		});
		expect(plan.games[0].kind).toBe('existing');
	});
});

describe('buildImportPlan - friends', () => {
	it('classifies friends by id, name and novelty', () => {
		const localById = makeFriend({ id: 'friend-1', name: 'Anna umbenannt' });
		const localByName = makeFriend({ id: 'other-id', name: 'ben' });
		const importedById = makeFriend({ id: 'friend-1', name: 'Anna' });
		const importedByName = makeFriend({ id: 'remote-id', name: 'Ben' });
		const importedNew = makeFriend({ id: 'new-id', name: 'Clara' });

		const plan = buildImportPlan(makeBundle({ friends: [importedById, importedByName, importedNew] }), {
			localGameTypes: [],
			localFriends: [localById, localByName],
			mode: 'friends',
		});

		expect(plan.friends[0]).toEqual({ kind: 'existing', friend: importedById, localFriend: localById });
		expect(plan.friends[1]).toEqual({ kind: 'nameConflict', friend: importedByName, localFriend: localByName });
		expect(plan.friends[2]).toEqual({ kind: 'new', friend: importedNew });
	});
});

describe('buildImportPlan - modes', () => {
	const fullBundle = makeBundle({
		games: [sharedGame],
		friends: [makeFriend({ id: 'remote-friend' })],
		matches: [{ id: 'm1', endedAt: 1, roundsCount: 1, players: [{ playerId: 'p1', name: 'A', color: '#fff' }], finalScores: { p1: 1 } }],
	});

	it("mode 'games' only consumes the games section", () => {
		const plan = buildImportPlan(fullBundle, { localGameTypes: [], localFriends: [], mode: 'games' });
		expect(plan.games).toHaveLength(1);
		expect(plan.friends).toHaveLength(0);
		expect(plan.matches).toHaveLength(0);
	});

	it("mode 'friends' only consumes the friends section", () => {
		const plan = buildImportPlan(fullBundle, { localGameTypes: [], localFriends: [], mode: 'friends' });
		expect(plan.games).toHaveLength(0);
		expect(plan.friends).toHaveLength(1);
		expect(plan.matches).toHaveLength(0);
	});

	it("mode 'all' consumes everything", () => {
		const plan = buildImportPlan(fullBundle, { localGameTypes: [], localFriends: [], mode: 'all' });
		expect(plan.games).toHaveLength(1);
		expect(plan.friends).toHaveLength(1);
		expect(plan.matches).toHaveLength(1);
	});
});

describe('dedupedFriendName', () => {
	it('appends the first free counter', () => {
		const friends = [makeFriend({ name: 'Anna' }), makeFriend({ id: 'x', name: 'Anna (2)' })];
		expect(dedupedFriendName('Anna', friends)).toBe('Anna (3)');
		expect(dedupedFriendName('Ben', friends)).toBe('Ben (2)');
	});
});

describe('remapSharedMatch', () => {
	const entry: GameHistoryEntry = {
		id: 'm1',
		endedAt: 1,
		roundsCount: 1,
		players: [
			{ playerId: 'p1', name: 'Anna', color: '#fff', friendId: 'remote-friend' },
			{ playerId: 'p2', name: 'Gast', color: '#000' },
		],
		finalScores: { p1: 1, p2: 2 },
		gameTypeId: 'remote-game-1',
	};

	it('rewrites game and friend references to the resolved local ids', () => {
		const remapped = remapSharedMatch(entry, {
			gameIdMap: { 'remote-game-1': 'local-game-1' },
			friendIdMap: { 'remote-friend': 'local-friend-1' },
		});
		expect(remapped.gameTypeId).toBe('local-game-1');
		expect(remapped.players[0].friendId).toBe('local-friend-1');
		expect(remapped.players[1].friendId).toBeUndefined();
		// The original entry stays untouched.
		expect(entry.gameTypeId).toBe('remote-game-1');
		expect(entry.players[0].friendId).toBe('remote-friend');
	});

	it('keeps unmapped ids so a later import can still link them', () => {
		const remapped = remapSharedMatch(entry, { gameIdMap: {}, friendIdMap: {} });
		expect(remapped.gameTypeId).toBe('remote-game-1');
		expect(remapped.players[0].friendId).toBe('remote-friend');
	});
});
