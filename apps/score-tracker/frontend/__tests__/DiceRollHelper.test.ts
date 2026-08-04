/**
 * Regression test for advantage/disadvantage picking the wrong dice.
 *
 * computeRoll used to compare the TOTALS of the two rolls and keep the whole
 * winning roll. With more than one die that is wrong: a die's worse value
 * could count just because its roll happened to win overall (reported with
 * W10+W4+W6 rolling 7/4/1 vs 8/3/4 - the old code kept the whole second roll
 * and its W4 showed 3 even though the first roll's W4 showed 4). Advantage and
 * disadvantage are decided per die: each die keeps its own higher (advantage)
 * or lower (disadvantage) value, and the result is the sum of the kept values.
 */

jest.mock('../helpers/RandomHelper', () => ({
	randomDieValue: jest.fn(),
}));

import { computeRoll } from '../helpers/DiceRollHelper';
import { randomDieValue } from '../helpers/RandomHelper';

const mockRandomDieValue = randomDieValue as jest.Mock;

const POOL = [
	{ id: 'die-1', sides: 10 },
	{ id: 'die-2', sides: 4 },
	{ id: 'die-3', sides: 6 },
];

function queueRolls(values: number[]) {
	mockRandomDieValue.mockReset();
	for (const value of values) {
		mockRandomDieValue.mockReturnValueOnce(value);
	}
}

describe('computeRoll', () => {
	it('sum mode rolls the pool once and adds everything up', () => {
		queueRolls([7, 4, 1]);
		const result = computeRoll(POOL, 'sum');
		if (result.mode !== 'sum') throw new Error('expected sum result');
		expect(result.dice.map((die) => die.value)).toEqual([7, 4, 1]);
		expect(result.total).toBe(12);
		expect(mockRandomDieValue).toHaveBeenCalledTimes(POOL.length);
	});

	it('advantage keeps each die\'s higher value, not the roll with the higher total', () => {
		// Roll A: 7/4/1 (total 12), roll B: 8/3/4 (total 15). Whole-roll advantage
		// would keep roll B for 15; per-die advantage keeps 8, 4 and 4 for 16.
		queueRolls([7, 4, 1, 8, 3, 4]);
		const result = computeRoll(POOL, 'advantage');
		if (result.mode !== 'advantage') throw new Error('expected advantage result');
		expect(result.rollA.total).toBe(12);
		expect(result.rollB.total).toBe(15);
		expect(result.keptRollById).toEqual({ 'die-1': 'B', 'die-2': 'A', 'die-3': 'B' });
		expect(result.keptTotal).toBe(16);
	});

	it('disadvantage keeps each die\'s lower value', () => {
		queueRolls([7, 4, 1, 8, 3, 4]);
		const result = computeRoll(POOL, 'disadvantage');
		if (result.mode !== 'disadvantage') throw new Error('expected disadvantage result');
		expect(result.keptRollById).toEqual({ 'die-1': 'A', 'die-2': 'B', 'die-3': 'A' });
		expect(result.keptTotal).toBe(7 + 3 + 1);
	});

	it('keeps the first roll\'s value on a per-die tie', () => {
		queueRolls([5, 2, 3, 5, 2, 3]);
		const advantage = computeRoll(POOL, 'advantage');
		if (advantage.mode !== 'advantage') throw new Error('expected advantage result');
		expect(advantage.keptRollById).toEqual({ 'die-1': 'A', 'die-2': 'A', 'die-3': 'A' });
		expect(advantage.keptTotal).toBe(10);

		queueRolls([5, 2, 3, 5, 2, 3]);
		const disadvantage = computeRoll(POOL, 'disadvantage');
		if (disadvantage.mode !== 'disadvantage') throw new Error('expected disadvantage result');
		expect(disadvantage.keptRollById).toEqual({ 'die-1': 'A', 'die-2': 'A', 'die-3': 'A' });
		expect(disadvantage.keptTotal).toBe(10);
	});

	it('works with a single die like the classic roll-twice-keep-one rule', () => {
		const singleDie = [{ id: 'die-1', sides: 20 }];
		queueRolls([11, 18]);
		const advantage = computeRoll(singleDie, 'advantage');
		if (advantage.mode !== 'advantage') throw new Error('expected advantage result');
		expect(advantage.keptTotal).toBe(18);

		queueRolls([11, 18]);
		const disadvantage = computeRoll(singleDie, 'disadvantage');
		if (disadvantage.mode !== 'disadvantage') throw new Error('expected disadvantage result');
		expect(disadvantage.keptTotal).toBe(11);
	});
});
