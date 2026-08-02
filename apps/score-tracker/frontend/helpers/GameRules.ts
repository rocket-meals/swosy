import type { GameType, ScoringMode } from './GameTypesStorage';
import type { GameCategory } from './GameCategories';
import { normalizeGameCategories } from './GameCategories';

// ─── Types ────────────────────────────────────────────────────────────────────
//
// A generic, JSON-only rule system for games whose score entry needs more than
// a plain number - e.g. "tap the cards you had this round". `scoreFormula` is
// a small whitelisted expression tree (not executable code) evaluated against
// the selected cards, so an imported/shared game preset can never run
// arbitrary logic - only the operations defined in `evaluateRuleExpr` below.

export type CardCategory = 'number' | 'modifier' | 'multiplier' | 'action';

export const CARD_CATEGORIES: CardCategory[] = ['number', 'modifier', 'multiplier', 'action'];

export type CardItem = {
	id: string;
	label: string;
	category: CardCategory;
	/** Face value used by `sumValues`/scoring. Irrelevant for plain action cards. */
	value?: number;
};

export type RuleExpr =
	| { op: 'const'; value: number }
	| { op: 'sumValues'; category?: CardCategory }
	| { op: 'countItems'; category?: CardCategory }
	| { op: 'hasItem'; itemId: string }
	| { op: 'add'; args: RuleExpr[] }
	| { op: 'multiply'; args: RuleExpr[] }
	| { op: 'if'; cond: RuleExpr; thenExpr: RuleExpr; elseExpr: RuleExpr }
	| { op: 'gte'; a: RuleExpr; b: RuleExpr };

// The `if` branches used to be called `then`/`else`. A `then` property makes an
// object a thenable, which `await`/Promise chains treat specially, so new rules
// are written with `thenExpr`/`elseExpr` - but persisted game types and shared
// preset JSON from older app versions still carry the legacy keys, so every
// reader below accepts both.
function getIfBranches<T>(expr: { thenExpr?: T; elseExpr?: T }): { thenBranch: T | undefined; elseBranch: T | undefined } {
	const legacy = expr as { then?: T; else?: T };
	return { thenBranch: expr.thenExpr ?? legacy.then, elseBranch: expr.elseExpr ?? legacy.else };
}

export type ScoreEntryRules = {
	/** The palette of selectable cards shown when entering a score. Tapping a
	 *  card always just toggles it on/off - a plain multi-select. Tapping an
	 *  already-selected card again (e.g. a mis-tapped duplicate number) simply
	 *  deselects it; there is no separate bust concept in the UI. */
	items: CardItem[];
	/** Computes the round score from the selected cards. */
	scoreFormula: RuleExpr;
	/**
	 * Reaching this many selected 'number' cards activates a bonus indicator
	 * (the score formula is expected to add `bonusPoints` itself once this
	 * many are selected - these two fields only drive the display, the
	 * formula's own result always stays authoritative for the actual score).
	 */
	bonusAtNumberCount?: number;
	/** Point value shown next to the bonus indicator/breakdown once `bonusAtNumberCount` is reached. */
	bonusPoints?: number;
};

export type GameRules = {
	version: 1;
	/** Custom score-entry rules (e.g. a card picker instead of a plain number). Absent = plain numeric entry. */
	scoreEntry?: ScoreEntryRules;
	/** Custom starting-player rule, only read when `GameType.startingPlayerMode === 'custom'`. */
	playerOrder?: PlayerOrderRule | null;
};

/** Rules/config fields shared between a shareable `GamePreset` and a stored `GameType`. */
export type GameTypeDefinition = {
	name: string;
	/** Emoji shown as the game's "image" in lists and headers (e.g. 🎲). */
	icon: string;
	/**
	 * Picture of the game, shown instead of the emoji wherever the game appears.
	 * Only the URL is stored, never the image itself (see helpers/ImageSearch);
	 * undefined/null = fall back to `icon`.
	 */
	imageUrl?: string | null;
	scoringMode: ScoringMode;
	/** Maximum number of rounds per match. undefined/null = unlimited. */
	maxRounds?: number | null;
	/** Total score at which a match ends. undefined/null = unlimited. */
	maxScore?: number | null;
	/** Custom score-entry rules (e.g. a card picker instead of a plain number). undefined/null = plain numeric entry. */
	rules?: GameRules | null;
	/**
	 * Extra things tracked about a match beyond the points - e.g. start/end
	 * time, the played map, the outcome, a note (see helpers/GameCategories).
	 * undefined/null = nothing extra is tracked.
	 */
	categories?: GameCategory[] | null;
	/**
	 * Whether players are scored with points at all. undefined/absent defaults
	 * to `true`. Set to `false` for games that are only tracked through
	 * player-scope categories (e.g. "gewonnen/verloren" plus "Wahnsinn"
	 * instead of a number) - the scoreboard then shows those values on the
	 * player tiles in place of a total score.
	 */
	trackScores?: boolean;
	/**
	 * Content version of this game definition (distinct from `rules.version`,
	 * the fixed rule-schema version). Bump this yourself when sharing an
	 * updated JSON so recipients re-importing it can tell it changed.
	 * Undefined/absent defaults to 1.
	 */
	version?: number;
};

/** A shareable game template: everything needed to create a new game type. */
export type GamePreset = GameTypeDefinition & {
	/** How the starting player rotates each round. undefined/absent defaults to 'fixed'. */
	startingPlayerMode?: StartingPlayerMode;
};

// ─── Evaluation ───────────────────────────────────────────────────────────────

export type RuleEvalContext = {
	selectedItems: CardItem[];
};

export function evaluateRuleExpr(expr: RuleExpr, ctx: RuleEvalContext): number {
	switch (expr.op) {
		case 'const':
			return expr.value;
		case 'sumValues': {
			const items = expr.category ? ctx.selectedItems.filter((item) => item.category === expr.category) : ctx.selectedItems;
			return items.reduce((sum, item) => sum + (item.value ?? 0), 0);
		}
		case 'countItems': {
			const items = expr.category ? ctx.selectedItems.filter((item) => item.category === expr.category) : ctx.selectedItems;
			return items.length;
		}
		case 'hasItem':
			return ctx.selectedItems.some((item) => item.id === expr.itemId) ? 1 : 0;
		case 'add':
			return expr.args.reduce((sum, arg) => sum + evaluateRuleExpr(arg, ctx), 0);
		case 'multiply':
			return expr.args.reduce((product, arg) => product * evaluateRuleExpr(arg, ctx), 1);
		case 'if': {
			const { thenBranch, elseBranch } = getIfBranches(expr);
			return evaluateRuleExpr(expr.cond, ctx) !== 0 ? evaluateRuleExpr(thenBranch!, ctx) : evaluateRuleExpr(elseBranch!, ctx);
		}
		case 'gte':
			return evaluateRuleExpr(expr.a, ctx) >= evaluateRuleExpr(expr.b, ctx) ? 1 : 0;
	}
}

// ─── Player order (starting-player rotation) ───────────────────────────────────
//
// Three built-in modes cover the common cases (seating order never changes,
// last round's best score starts next, simple round-robin). `custom` hands
// the decision to a small whitelisted expression tree evaluated against the
// previous round's per-seat scores and a carried-over numeric state - same
// "JSON only, no executable code" approach as `scoreFormula` above - for
// games with unusual dealer rules.
//
// "Seat"/index always refers to a position in the current, table-ordered
// player list (the same order shown/edited in the setup screen), not a
// player id - reordering players is a separate, purely manual action.

// The winner/loser modes are relative to the game's `scoringMode`: the winner
// is whoever scored best *according to the Wertung* (with 'lowWins' that's the
// fewest points), the loser is the other extreme. Winner AND loser modes exist
// because "who begins" is a house rule independent of who is leading - e.g.
// Odin is scored 'lowWins', yet the player with the most points of the last
// round starts the next one ('previousLoser'). The "previous*" pair looks at
// the round just played, the "total*" pair at the running totals of all
// rounds so far - together they cover every most/fewest × round/total combo.
export type StartingPlayerMode =
	| 'fixed'
	| 'previousWinner'
	| 'previousLoser'
	| 'totalWinner'
	| 'totalLoser'
	| 'rotate'
	| 'custom';

export const STARTING_PLAYER_MODES: StartingPlayerMode[] = [
	'fixed',
	'previousWinner',
	'previousLoser',
	'totalWinner',
	'totalLoser',
	'rotate',
	'custom',
];

export type PlayerOrderRuleExpr =
	| { op: 'const'; value: number }
	| { op: 'playerCount' }
	| { op: 'previousStartIndex' }
	| { op: 'state' }
	| { op: 'roundWinnerIndex' }
	| { op: 'roundLoserIndex' }
	| { op: 'totalWinnerIndex' }
	| { op: 'totalLoserIndex' }
	| { op: 'add'; args: PlayerOrderRuleExpr[] }
	| { op: 'mod'; a: PlayerOrderRuleExpr; b: PlayerOrderRuleExpr }
	| { op: 'if'; cond: PlayerOrderRuleExpr; thenExpr: PlayerOrderRuleExpr; elseExpr: PlayerOrderRuleExpr }
	| { op: 'gte'; a: PlayerOrderRuleExpr; b: PlayerOrderRuleExpr };

/**
 * A dynamic "who starts the next round" rule, evaluated once after each
 * round. `startIndex` picks the next starting seat; `nextState` becomes
 * `state` for the following round's evaluation (e.g. a dealer counter).
 */
export type PlayerOrderRule = {
	version: 1;
	startIndex: PlayerOrderRuleExpr;
	nextState: PlayerOrderRuleExpr;
	initialState: number;
};

export type PlayerOrderEvalContext = {
	/** Number of seats (players in table order). */
	playerCount: number;
	/** Seat index of whoever started the round just finished, or -1 if unknown (before round 1, or that seat no longer exists). */
	previousStartIndex: number;
	/** That round's own per-seat score (table order), null where not entered. */
	previousRoundScores: (number | null)[];
	/** Running per-seat total over all rounds so far (table order), null where nothing was entered yet. */
	totalScores: (number | null)[];
	scoringMode: ScoringMode;
	/** Carried-over numeric state from the previous evaluation (see `PlayerOrderRule.initialState`). */
	state: number;
};

function roundExtremeIndex(scores: (number | null)[], preferLower: boolean, fallback: number): number {
	let bestIndex = -1;
	let bestScore = preferLower ? Infinity : -Infinity;
	for (let i = 0; i < scores.length; i++) {
		const score = scores[i];
		if (score == null) continue;
		const isBetter = preferLower ? score < bestScore : score > bestScore;
		if (isBetter) {
			bestScore = score;
			bestIndex = i;
		}
	}
	return bestIndex >= 0 ? bestIndex : fallback;
}

/** Seat that scored best in the round *per the Wertung* ('lowWins' → fewest points). */
function roundWinnerIndex(scores: (number | null)[], scoringMode: ScoringMode, fallback: number): number {
	return roundExtremeIndex(scores, scoringMode === 'lowWins', fallback);
}

/** Seat that scored worst in the round *per the Wertung* ('lowWins' → most points). */
function roundLoserIndex(scores: (number | null)[], scoringMode: ScoringMode, fallback: number): number {
	return roundExtremeIndex(scores, scoringMode !== 'lowWins', fallback);
}

export function evaluatePlayerOrderExpr(expr: PlayerOrderRuleExpr, ctx: PlayerOrderEvalContext): number {
	switch (expr.op) {
		case 'const':
			return expr.value;
		case 'playerCount':
			return ctx.playerCount;
		case 'previousStartIndex':
			return ctx.previousStartIndex;
		case 'state':
			return ctx.state;
		case 'roundWinnerIndex':
			return roundWinnerIndex(ctx.previousRoundScores, ctx.scoringMode, Math.max(0, ctx.previousStartIndex));
		case 'roundLoserIndex':
			return roundLoserIndex(ctx.previousRoundScores, ctx.scoringMode, Math.max(0, ctx.previousStartIndex));
		case 'totalWinnerIndex':
			return roundWinnerIndex(ctx.totalScores, ctx.scoringMode, Math.max(0, ctx.previousStartIndex));
		case 'totalLoserIndex':
			return roundLoserIndex(ctx.totalScores, ctx.scoringMode, Math.max(0, ctx.previousStartIndex));
		case 'add':
			return expr.args.reduce((sum, arg) => sum + evaluatePlayerOrderExpr(arg, ctx), 0);
		case 'mod': {
			const b = evaluatePlayerOrderExpr(expr.b, ctx);
			if (b === 0) return 0;
			const a = evaluatePlayerOrderExpr(expr.a, ctx);
			return ((a % b) + b) % b;
		}
		case 'if': {
			const { thenBranch, elseBranch } = getIfBranches(expr);
			return evaluatePlayerOrderExpr(expr.cond, ctx) !== 0
				? evaluatePlayerOrderExpr(thenBranch!, ctx)
				: evaluatePlayerOrderExpr(elseBranch!, ctx);
		}
		case 'gte':
			return evaluatePlayerOrderExpr(expr.a, ctx) >= evaluatePlayerOrderExpr(expr.b, ctx) ? 1 : 0;
	}
}

/** Built-in "rotate" behavior expressed as a `PlayerOrderRule`, seeded when a game type first switches to `custom`. */
export const ROTATE_PLAYER_ORDER_RULE: PlayerOrderRule = {
	version: 1,
	startIndex: {
		op: 'mod',
		a: { op: 'add', args: [{ op: 'previousStartIndex' }, { op: 'const', value: 1 }] },
		b: { op: 'playerCount' },
	},
	nextState: { op: 'const', value: 0 },
	initialState: 0,
};

/**
 * Compute which seat (index into the current, table-ordered player list)
 * starts the next round, plus the numeric state to carry into the following
 * evaluation. `previousStartIndex`/`previousRoundScores` describe the round
 * just finished; pass `previousStartIndex: -1` before round 1 has been played.
 */
export function computeNextStartingPlayerIndex(params: {
	mode: StartingPlayerMode;
	customRule?: PlayerOrderRule | null;
	playerCount: number;
	previousStartIndex: number;
	previousRoundScores: (number | null)[];
	/** Running per-seat totals over all rounds so far (table order); only read by the "total*" modes and custom rules. */
	totalScores?: (number | null)[];
	scoringMode: ScoringMode;
	state: number;
}): { startIndex: number; nextState: number } {
	const { mode, customRule, playerCount, previousStartIndex, previousRoundScores, scoringMode, state } = params;
	const totalScores = params.totalScores ?? [];
	if (playerCount <= 0) return { startIndex: 0, nextState: state };

	switch (mode) {
		case 'fixed':
			return { startIndex: 0, nextState: state };
		case 'rotate': {
			const prev = Math.max(0, previousStartIndex);
			return { startIndex: (prev + 1) % playerCount, nextState: state };
		}
		case 'previousWinner':
			return {
				startIndex: roundWinnerIndex(previousRoundScores, scoringMode, Math.max(0, previousStartIndex)),
				nextState: state,
			};
		case 'previousLoser':
			return {
				startIndex: roundLoserIndex(previousRoundScores, scoringMode, Math.max(0, previousStartIndex)),
				nextState: state,
			};
		case 'totalWinner':
			return {
				startIndex: roundWinnerIndex(totalScores, scoringMode, Math.max(0, previousStartIndex)),
				nextState: state,
			};
		case 'totalLoser':
			return {
				startIndex: roundLoserIndex(totalScores, scoringMode, Math.max(0, previousStartIndex)),
				nextState: state,
			};
		case 'custom': {
			if (!customRule) return { startIndex: 0, nextState: state };
			const ctx: PlayerOrderEvalContext = { playerCount, previousStartIndex, previousRoundScores, totalScores, scoringMode, state };
			const rawIndex = Math.trunc(evaluatePlayerOrderExpr(customRule.startIndex, ctx));
			const nextState = evaluatePlayerOrderExpr(customRule.nextState, ctx);
			const startIndex = ((rawIndex % playerCount) + playerCount) % playerCount;
			return { startIndex, nextState };
		}
	}
}

// ─── Validation (for import) ───────────────────────────────────────────────────

function isRuleExpr(value: unknown): value is RuleExpr {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	switch (v.op) {
		case 'const':
			return typeof v.value === 'number';
		case 'sumValues':
		case 'countItems':
			return v.category === undefined || (typeof v.category === 'string' && CARD_CATEGORIES.includes(v.category as CardCategory));
		case 'hasItem':
			return typeof v.itemId === 'string';
		case 'add':
		case 'multiply':
			return Array.isArray(v.args) && v.args.length > 0 && v.args.every(isRuleExpr);
		case 'if': {
			const { thenBranch, elseBranch } = getIfBranches(v as { thenExpr?: unknown; elseExpr?: unknown });
			return isRuleExpr(v.cond) && isRuleExpr(thenBranch) && isRuleExpr(elseBranch);
		}
		case 'gte':
			return isRuleExpr(v.a) && isRuleExpr(v.b);
		default:
			return false;
	}
}

function isCardItem(value: unknown): value is CardItem {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	if (typeof v.id !== 'string' || v.id === '' || typeof v.label !== 'string') return false;
	if (typeof v.category !== 'string' || !CARD_CATEGORIES.includes(v.category as CardCategory)) return false;
	if (v.value !== undefined && typeof v.value !== 'number') return false;
	return true;
}

function isScoreEntryRules(value: unknown): value is ScoreEntryRules {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	if (!Array.isArray(v.items) || v.items.length === 0 || !v.items.every(isCardItem)) return false;
	const ids = new Set((v.items as CardItem[]).map((item) => item.id));
	if (ids.size !== v.items.length) return false;
	if (!isRuleExpr(v.scoreFormula)) return false;
	if (v.bonusAtNumberCount !== undefined && typeof v.bonusAtNumberCount !== 'number') return false;
	if (v.bonusPoints !== undefined && typeof v.bonusPoints !== 'number') return false;
	return true;
}

function isPlayerOrderRuleExpr(value: unknown): value is PlayerOrderRuleExpr {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	switch (v.op) {
		case 'const':
			return typeof v.value === 'number';
		case 'playerCount':
		case 'previousStartIndex':
		case 'state':
		case 'roundWinnerIndex':
		case 'roundLoserIndex':
		case 'totalWinnerIndex':
		case 'totalLoserIndex':
			return true;
		case 'add':
			return Array.isArray(v.args) && v.args.length > 0 && v.args.every(isPlayerOrderRuleExpr);
		case 'mod':
			return isPlayerOrderRuleExpr(v.a) && isPlayerOrderRuleExpr(v.b);
		case 'if': {
			const { thenBranch, elseBranch } = getIfBranches(v as { thenExpr?: unknown; elseExpr?: unknown });
			return isPlayerOrderRuleExpr(v.cond) && isPlayerOrderRuleExpr(thenBranch) && isPlayerOrderRuleExpr(elseBranch);
		}
		case 'gte':
			return isPlayerOrderRuleExpr(v.a) && isPlayerOrderRuleExpr(v.b);
		default:
			return false;
	}
}

function isPlayerOrderRule(value: unknown): value is PlayerOrderRule {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	if (v.version !== 1) return false;
	if (!isPlayerOrderRuleExpr(v.startIndex)) return false;
	if (!isPlayerOrderRuleExpr(v.nextState)) return false;
	if (typeof v.initialState !== 'number') return false;
	return true;
}

/** Validate an imported player-order rule. Returns it typed, or `null` if malformed. */
export function validatePlayerOrderRule(value: unknown): PlayerOrderRule | null {
	return isPlayerOrderRule(value) ? (value as PlayerOrderRule) : null;
}

/** Validate an imported rules object. Returns it typed, or `null` if malformed. */
export function validateGameRules(value: unknown): GameRules | null {
	if (typeof value !== 'object' || value === null) return null;
	const v = value as Record<string, unknown>;
	if (v.version !== 1) return null;

	let scoreEntry: ScoreEntryRules | undefined;
	if (v.scoreEntry !== undefined && v.scoreEntry !== null) {
		if (!isScoreEntryRules(v.scoreEntry)) return null;
		scoreEntry = v.scoreEntry as ScoreEntryRules;
	}

	let playerOrder: PlayerOrderRule | null | undefined;
	if (v.playerOrder !== undefined && v.playerOrder !== null) {
		playerOrder = validatePlayerOrderRule(v.playerOrder);
		if (!playerOrder) return null;
	}

	return { version: 1, scoreEntry, playerOrder };
}

/**
 * Validates the plain scalar fields of a parsed game-preset object (everything
 * except the nested `rules`, which `parseGamePreset` validates separately since
 * it needs to keep the parsed `GameRules` value, not just a boolean). A type
 * predicate (like `isRuleExpr`/`isCardItem` above) so `parseGamePreset` keeps
 * the same narrowed field types on `v` after the check as it did before this
 * was split out into its own function.
 */
function isValidGamePresetScalarFields(
	v: Record<string, unknown>,
): v is Record<string, unknown> & {
	name: string;
	icon: string;
	scoringMode: 'highWins' | 'lowWins';
	imageUrl: string | null | undefined;
	maxRounds: number | null | undefined;
	maxScore: number | null | undefined;
	version: number | undefined;
	startingPlayerMode: StartingPlayerMode | undefined;
	trackScores: boolean | undefined;
} {
	if (typeof v.name !== 'string' || v.name.trim() === '') return false;
	if (typeof v.icon !== 'string' || v.icon === '') return false;
	if (v.imageUrl !== undefined && v.imageUrl !== null && typeof v.imageUrl !== 'string') return false;
	if (v.scoringMode !== 'highWins' && v.scoringMode !== 'lowWins') return false;
	if (v.maxRounds !== undefined && v.maxRounds !== null && typeof v.maxRounds !== 'number') return false;
	if (v.maxScore !== undefined && v.maxScore !== null && typeof v.maxScore !== 'number') return false;
	if (v.version !== undefined && typeof v.version !== 'number') return false;
	if (v.startingPlayerMode !== undefined && !STARTING_PLAYER_MODES.includes(v.startingPlayerMode as StartingPlayerMode)) return false;
	if (v.trackScores !== undefined && typeof v.trackScores !== 'boolean') return false;
	return true;
}

/** Strip the instance-specific id/createdAt so a game type can be shared/re-imported as a template. */
export function gameTypeToPreset(gameType: GameType): GamePreset {
	return {
		name: gameType.name,
		icon: gameType.icon,
		imageUrl: gameType.imageUrl ?? null,
		scoringMode: gameType.scoringMode,
		maxRounds: gameType.maxRounds ?? null,
		maxScore: gameType.maxScore ?? null,
		rules: gameType.rules ?? null,
		categories: gameType.categories ?? null,
		trackScores: gameType.trackScores ?? true,
		startingPlayerMode: gameType.startingPlayerMode ?? 'fixed',
		version: gameType.version ?? 1,
	};
}

/**
 * Parse a shareable game-template JSON string (as produced by "Spiel
 * exportieren") for import. Returns the parsed preset, or `null` if the text
 * isn't a valid one.
 */
export function parseGamePreset(text: string): GamePreset | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return null;
	}
	if (typeof parsed !== 'object' || parsed === null) return null;
	const v = parsed as Record<string, unknown>;
	if (!isValidGamePresetScalarFields(v)) return null;

	let rules: GameRules | null = null;
	if (v.rules !== undefined && v.rules !== null) {
		rules = validateGameRules(v.rules);
		if (!rules) return null;
	}

	let categories: GameCategory[] | null = null;
	if (v.categories !== undefined && v.categories !== null) {
		categories = normalizeGameCategories(v.categories);
		if (!categories) return null;
	}

	return {
		name: v.name,
		icon: v.icon,
		imageUrl: v.imageUrl ?? null,
		scoringMode: v.scoringMode,
		maxRounds: (v.maxRounds as number | null | undefined) ?? null,
		maxScore: (v.maxScore as number | null | undefined) ?? null,
		rules,
		categories,
		trackScores: v.trackScores ?? true,
		startingPlayerMode: (v.startingPlayerMode as StartingPlayerMode | undefined) ?? 'fixed',
		version: (v.version as number | undefined) ?? 1,
	};
}

// ─── Built-in Flip Seven preset ────────────────────────────────────────────────
//
// Official rules: number cards 0-12 scored at face value, +2/+4/+6/+8/+10 flat
// modifiers, a single x2 multiplier applied to the number-card sum only, and
// collecting 7 unique number cards ends the round instantly with a +15
// bonus. First to 200 total points wins.
//
// This app only records the outcome of a round played at the table, not a
// live turn-by-turn simulation: there's no Freeze/Flip Three/Second Chance
// automation (those only affect who draws next during live play, not the
// final score), and no separate "bust" concept - tapping a card is always a
// plain select/deselect, so a mis-tapped duplicate number just deselects.

function numberCard(n: number): CardItem {
	return { id: `n${n}`, label: String(n), category: 'number', value: n };
}

const FLIP_SEVEN_ITEMS: CardItem[] = [
	...Array.from({ length: 13 }, (_, n) => numberCard(n)),
	{ id: 'mod2', label: '+2', category: 'modifier', value: 2 },
	{ id: 'mod4', label: '+4', category: 'modifier', value: 4 },
	{ id: 'mod6', label: '+6', category: 'modifier', value: 6 },
	{ id: 'mod8', label: '+8', category: 'modifier', value: 8 },
	{ id: 'mod10', label: '+10', category: 'modifier', value: 10 },
	{ id: 'x2', label: 'x2', category: 'multiplier', value: 2 },
];

const FLIP_SEVEN_SCORE_FORMULA: RuleExpr = {
	op: 'add',
	args: [
		{
			op: 'multiply',
			args: [
				{ op: 'sumValues', category: 'number' },
				{ op: 'if', cond: { op: 'hasItem', itemId: 'x2' }, thenExpr: { op: 'const', value: 2 }, elseExpr: { op: 'const', value: 1 } },
			],
		},
		{ op: 'sumValues', category: 'modifier' },
		{
			op: 'if',
			cond: { op: 'gte', a: { op: 'countItems', category: 'number' }, b: { op: 'const', value: 7 } },
			thenExpr: { op: 'const', value: 15 },
			elseExpr: { op: 'const', value: 0 },
		},
	],
};

export const FLIP_SEVEN_PRESET: GamePreset = {
	name: 'Flip Seven',
	icon: '🃏',
	scoringMode: 'highWins',
	maxRounds: null,
	maxScore: 200,
	version: 1,
	trackScores: true,
	categories: null,
	rules: {
		version: 1,
		scoreEntry: {
			items: FLIP_SEVEN_ITEMS,
			scoreFormula: FLIP_SEVEN_SCORE_FORMULA,
			bonusAtNumberCount: 7,
			bonusPoints: 15,
		},
	},
};

// ─── Built-in "Villen des Wahnsinns" preset ───────────────────────────────────
//
// A co-op game that isn't scored with points at all (`trackScores: false`):
// what's worth recording is which map was chosen, how it ended - and per
// investigator whether they went insane. Start, end and duration of a match
// are built-in fields of every match (see helpers/MatchTimes), so the preset
// doesn't need time categories at all. Purely an example of what custom
// categories can express (see helpers/GameCategories.ts); nothing here is
// specific to that game in code.

export const MANSIONS_OF_MADNESS_PRESET: GamePreset = {
	name: 'Villen des Wahnsinns',
	icon: '🏰',
	scoringMode: 'highWins',
	maxRounds: null,
	maxScore: null,
	version: 1,
	rules: null,
	trackScores: false,
	categories: [
		{ id: 'map', name: 'Gespielte Karte', type: 'text', scope: 'match' },
		{
			id: 'status',
			name: 'Spielstatus',
			type: 'enum',
			scope: 'match',
			options: [
				{ id: 'won', label: 'Gewonnen' },
				{ id: 'lost', label: 'Verloren' },
				{ id: 'aborted', label: 'Abgebrochen' },
			],
		},
		{ id: 'note', name: 'Notiz', type: 'text', scope: 'match' },
		{
			id: 'playerStatus',
			name: 'Ergebnis',
			type: 'enum',
			scope: 'player',
			options: [
				{ id: 'survived', label: 'Überlebt' },
				{ id: 'dead', label: 'Gestorben' },
			],
		},
		{ id: 'insanity', name: 'Wahnsinn', type: 'boolean', scope: 'player' },
		{ id: 'insanityNote', name: 'Wahnsinn (Notiz)', type: 'text', scope: 'player' },
	],
};
