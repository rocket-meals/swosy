/**
 * Regression test for the dice screen always rolling a 1.
 *
 * React Native/Hermes has no global `crypto.getRandomValues` (no polyfill is
 * installed in this app), so `randomDieValue` always used its fallback PRNG.
 * That fallback multiplied its seed with a plain `*`, which overflows
 * Number.MAX_SAFE_INTEGER and silently zeroes out the low bits the byte is
 * read from - so every roll came out as `(0 % sides) + 1 === 1`.
 */

import { randomDieValue } from '../helpers/RandomHelper';

describe('randomDieValue - fallback PRNG (no crypto.getRandomValues available)', () => {
	const originalCrypto = (globalThis as { crypto?: Crypto }).crypto;

	beforeAll(() => {
		// Simulate the React Native/Hermes runtime, which has no crypto global.
		delete (globalThis as { crypto?: Crypto }).crypto;
	});

	afterAll(() => {
		(globalThis as { crypto?: Crypto }).crypto = originalCrypto;
	});

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
});
