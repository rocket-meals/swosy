/**
 * Regression test for generateRandomIdSuffix producing collision-prone ids.
 *
 * The old implementation's crypto-less fallback ran a hand-rolled LCG that
 * multiplied its seed with a plain `*`. That overflows Number.MAX_SAFE_INTEGER
 * and silently zeroes out the low bits the suffix characters were read from,
 * so calls made within the same millisecond (the normal case in a tight loop,
 * e.g. starting several activities/routes back to back) returned the exact
 * same suffix - defeating the whole point of appending "randomness" to the
 * id. IdHelper is now backed by plain Math.random() (not security-sensitive -
 * local ids only), so this just guards against a regression.
 */

import { generateRandomIdSuffix } from '../helpers/IdHelper';

describe('generateRandomIdSuffix', () => {
	it('does not return the same suffix on consecutive calls', () => {
		// A large sample size matters here: the old buggy LCG only got "unstuck"
		// when Date.now() ticked over to the next millisecond, so a handful of
		// samples could pass by luck. True randomness over a 36^7 suffix space
		// should give (near) all-distinct values; the old bug gave only a
		// handful of distinct values no matter the sample size.
		const suffixes = Array.from({ length: 300 }, () => generateRandomIdSuffix());
		const distinctValues = new Set(suffixes);

		expect(distinctValues.size).toBeGreaterThan(250);
	});

	it('returns a suffix of the requested length made only of lowercase letters and digits', () => {
		const suffix = generateRandomIdSuffix(7);
		expect(suffix).toHaveLength(7);
		expect(suffix).toMatch(/^[a-z0-9]+$/);
	});

	it('respects a custom length', () => {
		const suffix = generateRandomIdSuffix(12);
		expect(suffix).toHaveLength(12);
	});
});
