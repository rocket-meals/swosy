// The helpers only need the storage functions from common-ui; mocking the
// package keeps jest away from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import type { Friend } from '../helpers/FriendsStorage';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import type { GameType } from '../helpers/GameTypesStorage';
import {
	SHARE_STRING_PREFIX,
	buildFriendsShareBundle,
	buildGamesShareBundle,
	buildMatchShareBundle,
	decodeShareText,
	encodeShareBundle,
} from '../helpers/ShareCodec';

function makeGameType(overrides: Partial<GameType> = {}): GameType {
	return {
		id: 'game-1',
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
		version: 3,
		createdAt: 1000,
		...overrides,
	};
}

function makeFriend(overrides: Partial<Friend> = {}): Friend {
	return { id: 'friend-1', name: 'Anna', color: '#2563eb', createdAt: 1000, ...overrides };
}

function makeMatch(overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
	return {
		id: 'match-1',
		endedAt: 2000,
		roundsCount: 2,
		players: [
			{ playerId: 'p1', name: 'Anna', color: '#2563eb', friendId: 'friend-1' },
			{ playerId: 'p2', name: 'Gast', color: '#dc2626' },
		],
		finalScores: { p1: 42, p2: 17 },
		gameTypeId: 'game-1',
		rounds: [
			{ id: 'r1', scores: { p1: 20, p2: 10 } },
			{ id: 'r2', scores: { p1: 22, p2: 7 } },
		],
		...overrides,
	};
}

describe('ShareCodec', () => {
	it('round-trips a full match bundle through the compressed export string', () => {
		const bundle = buildMatchShareBundle({
			entry: makeMatch(),
			gameType: makeGameType(),
			friends: [makeFriend(), makeFriend({ id: 'friend-2', name: 'Ben' })],
		});
		const encoded = encodeShareBundle(bundle);
		expect(encoded.startsWith(SHARE_STRING_PREFIX)).toBe(true);

		const decoded = decodeShareText(encoded);
		expect(decoded).not.toBeNull();
		expect(decoded?.matches).toHaveLength(1);
		expect(decoded?.matches?.[0].id).toBe('match-1');
		expect(decoded?.games).toHaveLength(1);
		expect(decoded?.games?.[0].name).toBe('Flip Seven');
		expect(decoded?.games?.[0].id).toBe('game-1');
		// Only the participating friend is bundled, not the whole roster.
		expect(decoded?.friends?.map((friend) => friend.id)).toEqual(['friend-1']);
	});

	it('bundles a match without a specific game', () => {
		const bundle = buildMatchShareBundle({ entry: makeMatch({ gameTypeId: undefined }), friends: [] });
		expect(bundle.games).toEqual([]);
		const decoded = decodeShareText(encodeShareBundle(bundle));
		expect(decoded?.matches).toHaveLength(1);
	});

	it('round-trips games-only and friends-only bundles', () => {
		const games = decodeShareText(encodeShareBundle(buildGamesShareBundle([makeGameType()])));
		expect(games?.games).toHaveLength(1);
		expect(games?.matches).toBeUndefined();

		const friends = decodeShareText(encodeShareBundle(buildFriendsShareBundle([makeFriend()])));
		expect(friends?.friends).toHaveLength(1);
		expect(friends?.games).toBeUndefined();
	});

	it('accepts the plain (uncompressed) envelope JSON', () => {
		const bundle = buildGamesShareBundle([makeGameType()]);
		const decoded = decodeShareText(JSON.stringify(bundle, null, 2));
		expect(decoded?.games).toHaveLength(1);
	});

	it('accepts the legacy friends export (bare Friend[] array)', () => {
		const decoded = decodeShareText(JSON.stringify([makeFriend(), makeFriend({ id: 'friend-2', name: 'Ben' })]));
		expect(decoded?.friends).toHaveLength(2);
		expect(decoded?.games).toBeUndefined();
	});

	it('accepts the legacy game preset export (single object and array)', () => {
		const preset = { name: 'Skat', icon: '🃏', scoringMode: 'highWins' };
		expect(decodeShareText(JSON.stringify(preset))?.games).toHaveLength(1);
		expect(decodeShareText(JSON.stringify([preset, { ...preset, name: 'Doppelkopf' }]))?.games).toHaveLength(2);
	});

	it('rejects garbage, empty text and tampered payloads', () => {
		expect(decodeShareText('')).toBeNull();
		expect(decodeShareText('   ')).toBeNull();
		expect(decodeShareText('kein export')).toBeNull();
		expect(decodeShareText('{"type": "something-else", "version": 1}')).toBeNull();
		expect(decodeShareText(`${SHARE_STRING_PREFIX}!!!kaputt!!!`)).toBeNull();
		// A match without players is not a valid shared match.
		expect(
			decodeShareText(
				JSON.stringify({ type: 'score-tracker-export', version: 1, matches: [{ id: 'x', endedAt: 1, roundsCount: 0, players: [], finalScores: {} }] }),
			),
		).toBeNull();
	});

	it('compresses noticeably compared to the pretty-printed JSON', () => {
		const bundle = buildMatchShareBundle({ entry: makeMatch(), gameType: makeGameType(), friends: [makeFriend()] });
		const encoded = encodeShareBundle(bundle);
		expect(encoded.length).toBeLessThan(JSON.stringify(bundle, null, 2).length);
	});
});
