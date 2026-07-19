import type { ScoringMode } from './GameTypesStorage';

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
	| { op: 'if'; cond: RuleExpr; then: RuleExpr; else: RuleExpr }
	| { op: 'gte'; a: RuleExpr; b: RuleExpr };

export type ScoreEntryRules = {
	/** The palette of selectable cards shown when entering a score. Tapping a
	 *  card always just toggles it on/off - a plain multi-select, no
	 *  automatic duplicate/bust detection or play-flow simulation. */
	items: CardItem[];
	/** Computes the round score from the selected cards (skipped entirely - score is 0 - while busted). */
	scoreFormula: RuleExpr;
	/**
	 * Label for an explicit "I busted" toggle (e.g. "0 Punkte - doppelte Zahl
	 * gezogen"), shown as its own button below the cards. Activating it
	 * forces the round score to 0 regardless of the card selection; it can be
	 * toggled back off just as freely if tapped by mistake. Undefined/absent
	 * = no such button (plain card-tally games with no bust concept).
	 */
	bustLabel?: string;
	/** Reaching this many selected 'number' cards surfaces an informational bonus notice (the score formula is expected to add its own bonus). */
	bonusAtNumberCount?: number;
};

export type GameRules = {
	version: 1;
	scoreEntry: ScoreEntryRules;
};

/** A shareable game template: everything needed to create a new game type. */
export type GamePreset = {
	name: string;
	icon: string;
	scoringMode: ScoringMode;
	maxRounds?: number | null;
	maxScore?: number | null;
	rules?: GameRules | null;
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
		case 'if':
			return evaluateRuleExpr(expr.cond, ctx) !== 0 ? evaluateRuleExpr(expr.then, ctx) : evaluateRuleExpr(expr.else, ctx);
		case 'gte':
			return evaluateRuleExpr(expr.a, ctx) >= evaluateRuleExpr(expr.b, ctx) ? 1 : 0;
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
		case 'if':
			return isRuleExpr(v.cond) && isRuleExpr(v.then) && isRuleExpr(v.else);
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
	if (v.bustLabel !== undefined && (typeof v.bustLabel !== 'string' || v.bustLabel === '')) return false;
	if (v.bonusAtNumberCount !== undefined && typeof v.bonusAtNumberCount !== 'number') return false;
	return true;
}

/** Validate an imported rules object. Returns it typed, or `null` if malformed. */
export function validateGameRules(value: unknown): GameRules | null {
	if (typeof value !== 'object' || value === null) return null;
	const v = value as Record<string, unknown>;
	if (v.version !== 1) return null;
	if (!isScoreEntryRules(v.scoreEntry)) return null;
	return { version: 1, scoreEntry: v.scoreEntry as ScoreEntryRules };
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
	if (typeof v.name !== 'string' || v.name.trim() === '') return null;
	if (typeof v.icon !== 'string' || v.icon === '') return null;
	if (v.scoringMode !== 'highWins' && v.scoringMode !== 'lowWins') return null;
	if (v.maxRounds !== undefined && v.maxRounds !== null && typeof v.maxRounds !== 'number') return null;
	if (v.maxScore !== undefined && v.maxScore !== null && typeof v.maxScore !== 'number') return null;

	let rules: GameRules | null = null;
	if (v.rules !== undefined && v.rules !== null) {
		rules = validateGameRules(v.rules);
		if (!rules) return null;
	}

	return {
		name: v.name,
		icon: v.icon,
		scoringMode: v.scoringMode,
		maxRounds: (v.maxRounds as number | null | undefined) ?? null,
		maxScore: (v.maxScore as number | null | undefined) ?? null,
		rules,
	};
}

// ─── Built-in Flip Seven preset ────────────────────────────────────────────────
//
// Official rules: number cards 0-12 scored at face value, +2/+4/+6/+8/+10 flat
// modifiers, a single x2 multiplier applied to the number-card sum only,
// collecting 7 unique number cards ends the round instantly with a +15 bonus,
// and a duplicate number card busts the round to 0 (unless saved with a
// Second Chance). First to 200 total points wins.
//
// This app only records the outcome of a round played at the table, not a
// live turn-by-turn simulation - so busting is an explicit "0 Punkte" toggle
// the player sets themselves (see `bustLabel`) rather than something inferred
// from tapping a card twice, and there's no Freeze/Flip Three automation:
// those only affect who draws next during live play, not the final score.

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
	{ id: 'secondChance', label: 'Second Chance', category: 'action' },
];

const FLIP_SEVEN_SCORE_FORMULA: RuleExpr = {
	op: 'add',
	args: [
		{
			op: 'multiply',
			args: [
				{ op: 'sumValues', category: 'number' },
				{ op: 'if', cond: { op: 'hasItem', itemId: 'x2' }, then: { op: 'const', value: 2 }, else: { op: 'const', value: 1 } },
			],
		},
		{ op: 'sumValues', category: 'modifier' },
		{
			op: 'if',
			cond: { op: 'gte', a: { op: 'countItems', category: 'number' }, b: { op: 'const', value: 7 } },
			then: { op: 'const', value: 15 },
			else: { op: 'const', value: 0 },
		},
	],
};

export const FLIP_SEVEN_PRESET: GamePreset = {
	name: 'Flip Seven',
	icon: '🃏',
	scoringMode: 'highWins',
	maxRounds: null,
	maxScore: 200,
	rules: {
		version: 1,
		scoreEntry: {
			items: FLIP_SEVEN_ITEMS,
			scoreFormula: FLIP_SEVEN_SCORE_FORMULA,
			bustLabel: '0 Punkte - doppelte Zahl gezogen',
			bonusAtNumberCount: 7,
		},
	},
};
