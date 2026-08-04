// Dice rolling semantics for the dice screen.
//
// "sum" rolls the pool once and adds everything up. "advantage"/"disadvantage"
// roll the whole pool twice and decide PER DIE which of its two values counts:
// each die keeps its higher (advantage) or lower (disadvantage) value, and the
// result is the sum of the kept values. Nothing is hidden or "loaded" - both
// rolls are shown in the UI and only each die's kept value is highlighted.
// This is the classic single-die "roll twice, keep one" rule applied to every
// die individually - NOT to the totals of the two rolls, which would let a
// die's worse value count just because its roll happened to win overall.

import { randomDieValue } from './RandomHelper';

export type RollMode = 'sum' | 'advantage' | 'disadvantage';

export type PoolDie = { id: string; sides: number };
export type DieResult = PoolDie & { value: number };
export type DiceRoll = { dice: DieResult[]; total: number };

export type RollResult =
	| { mode: 'sum'; dice: DieResult[]; total: number }
	| {
			mode: 'advantage' | 'disadvantage';
			rollA: DiceRoll;
			rollB: DiceRoll;
			/** For each die id, which of the two rolls holds its kept value ('A' on ties). */
			keptRollById: Record<string, 'A' | 'B'>;
			/** Sum of every die's kept value. */
			keptTotal: number;
	  };

export function rollPoolOnce(pool: PoolDie[]): DiceRoll {
	const dice = pool.map((die) => ({ ...die, value: randomDieValue(die.sides) }));
	return { dice, total: dice.reduce((sum, die) => sum + die.value, 0) };
}

export function computeRoll(pool: PoolDie[], mode: RollMode): RollResult {
	const rollA = rollPoolOnce(pool);
	if (mode === 'sum') {
		return { mode, dice: rollA.dice, total: rollA.total };
	}
	const rollB = rollPoolOnce(pool);
	const keptRollById: Record<string, 'A' | 'B'> = {};
	let keptTotal = 0;
	rollA.dice.forEach((dieA, index) => {
		const dieB = rollB.dice[index];
		const keepA = mode === 'advantage' ? dieA.value >= dieB.value : dieA.value <= dieB.value;
		keptRollById[dieA.id] = keepA ? 'A' : 'B';
		keptTotal += keepA ? dieA.value : dieB.value;
	});
	return { mode, rollA, rollB, keptRollById, keptTotal };
}
