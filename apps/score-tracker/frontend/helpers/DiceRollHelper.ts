// Dice rolling semantics for the dice screen.
//
// "sum" rolls the pool once and adds everything up. "advantage"/"disadvantage"
// roll every die in the pool twice and decide PER DIE which of its two values
// counts: each die keeps its higher (advantage) or lower (disadvantage) value,
// and the result is the sum of the kept values. Nothing is hidden or "loaded" -
// both values of every die are shown in the UI and the kept one is highlighted.
// This is the classic single-die "roll twice, keep one" rule applied to every
// die individually - NOT to the totals of two whole rolls, which would let a
// die's worse value count just because its roll happened to win overall.

import { randomDieValue } from './RandomHelper';

export type RollMode = 'sum' | 'advantage' | 'disadvantage';

export type PoolDie = { id: string; sides: number };
export type DieResult = PoolDie & { value: number };

/** One die rolled twice: both values plus which of them counts ('A' on ties). */
export type DieRollPair = PoolDie & { valueA: number; valueB: number; kept: 'A' | 'B' };

export type RollResult =
	| { mode: 'sum'; dice: DieResult[]; total: number }
	| { mode: 'advantage' | 'disadvantage'; dice: DieRollPair[]; keptTotal: number };

function rollPoolOnce(pool: PoolDie[]): DieResult[] {
	return pool.map((die) => ({ ...die, value: randomDieValue(die.sides) }));
}

export function computeRoll(pool: PoolDie[], mode: RollMode): RollResult {
	const rollA = rollPoolOnce(pool);
	if (mode === 'sum') {
		return { mode, dice: rollA, total: rollA.reduce((sum, die) => sum + die.value, 0) };
	}
	const rollB = rollPoolOnce(pool);
	let keptTotal = 0;
	const dice = rollA.map((dieA, index) => {
		const valueB = rollB[index].value;
		const keepA = mode === 'advantage' ? dieA.value >= valueB : dieA.value <= valueB;
		keptTotal += keepA ? dieA.value : valueB;
		return { id: dieA.id, sides: dieA.sides, valueA: dieA.value, valueB, kept: keepA ? ('A' as const) : ('B' as const) };
	});
	return { mode, dice, keptTotal };
}
