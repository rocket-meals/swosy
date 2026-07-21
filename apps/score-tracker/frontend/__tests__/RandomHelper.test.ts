/**
 * Regression test for the dice screen always rolling a 1.
 *
 * randomDieValue used to run through a hand-rolled fallback PRNG (needed for
 * runtimes without crypto.getRandomValues, e.g. React Native/Hermes) whose LCG
 * multiplied its seed with a plain `*`. That overflows Number.MAX_SAFE_INTEGER
 * and silently zeroes out the low bits the byte was read from, so every roll
 * came out as `(0 % sides) + 1 === 1`. RandomHelper is now backed by plain
 * Math.random() (not security-sensitive - local ids and dice rolls only), so
 * this just guards against a regression in that single central function.
 */

import { randomDieValue } from '../helpers/RandomHelper';

describe('randomDieValue', () => {
	it('does not always roll a 1 for a six-sided die', () => {
		const rolls = Array.from({ length: 200 }, () => randomDieValue(6));
		const distinctValues = new Set(rolls);

		expect(distinctValues.size).toBeGreaterThan(1);
		expect(rolls.every((value) => value === 1)).toBe(false);
	});

	it('produces a roughly uniform spread across all faces of a six-sided die', () => {
		const rolls = Array.from({ length: 600 }, () => randomDieValue(6));
		for (let face = 1; face <= 6; face++) {
			expect(rolls).toContain(face);
		}
	});

	it('stays within [1, sides] for a variety of die sizes', () => {
		for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
			for (let i = 0; i < 50; i++) {
				const value = randomDieValue(sides);
				expect(value).toBeGreaterThanOrEqual(1);
				expect(value).toBeLessThanOrEqual(sides);
			}
		}
	});

	it('returns 1 for a die with 1 or fewer sides', () => {
		expect(randomDieValue(1)).toBe(1);
		expect(randomDieValue(0)).toBe(1);
	});
});
