import { UuidHelper } from '../UuidHelper';

describe('UuidHelper.randomUUID', () => {
	it('defaults to a length that carries about as much randomness as a v4 UUID', () => {
		expect(UuidHelper.randomUUID()).toHaveLength(UuidHelper.DEFAULT_LENGTH);
	});

	it('returns exactly the requested number of characters', () => {
		expect(UuidHelper.randomUUID(1)).toHaveLength(1);
		expect(UuidHelper.randomUUID(6)).toHaveLength(6);
		expect(UuidHelper.randomUUID(64)).toHaveLength(64);
	});

	it('only uses digits and letters', () => {
		expect(UuidHelper.randomUUID(500)).toMatch(/^[0-9a-zA-Z]+$/);
	});

	it('does not repeat itself', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => UuidHelper.randomUUID()));
		expect(ids.size).toBe(1000);
	});

	it('rejects a length that cannot produce an id', () => {
		expect(() => UuidHelper.randomUUID(0)).toThrow('positive integer');
		expect(() => UuidHelper.randomUUID(-1)).toThrow('positive integer');
		// short-unique-id builds a `new Array(length)` internally, so a fractional
		// length would fail with a bare RangeError instead of a useful message.
		expect(() => UuidHelper.randomUUID(2.5)).toThrow('positive integer');
	});
});

describe('UuidHelper.randomIdLowerCase', () => {
	it('never returns an upper case character', () => {
		expect(UuidHelper.randomIdLowerCase(500)).toMatch(/^[0-9a-z]+$/);
	});

	it('returns exactly the requested number of characters', () => {
		expect(UuidHelper.randomIdLowerCase(7)).toHaveLength(7);
		expect(UuidHelper.randomIdLowerCase(12)).toHaveLength(12);
	});

	it('does not repeat itself at a realistic length', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => UuidHelper.randomIdLowerCase(12)));
		expect(ids.size).toBe(1000);
	});

	it('rejects a length that cannot produce an id', () => {
		expect(() => UuidHelper.randomIdLowerCase(0)).toThrow('positive integer');
	});
});
