import { UuidHelper } from '../UuidHelper';

describe('UuidHelper.randomUUID', () => {
	it('returns an id in the RFC 4122 version 4 layout', () => {
		expect(UuidHelper.randomUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});

	it('keeps the version and the variant fixed for every generated id', () => {
		for (let i = 0; i < 200; i++) {
			const uuid = UuidHelper.randomUUID();
			expect(uuid).toHaveLength(36);
			expect(uuid[14]).toBe('4');
			expect('89ab').toContain(uuid[19]);
		}
	});

	it('does not repeat itself', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => UuidHelper.randomUUID()));
		expect(ids.size).toBe(1000);
	});
});

describe('UuidHelper.randomId', () => {
	it('returns exactly the requested number of characters', () => {
		expect(UuidHelper.randomId(1)).toHaveLength(1);
		expect(UuidHelper.randomId(6)).toHaveLength(6);
		expect(UuidHelper.randomId(64)).toHaveLength(64);
	});

	it('only uses characters from the default alphabet', () => {
		expect(UuidHelper.randomId(500)).toMatch(/^[0-9a-zA-Z]+$/);
	});

	it('honours a custom alphabet', () => {
		expect(UuidHelper.randomId(50, 'ab')).toMatch(/^[ab]{50}$/);
	});

	it('rejects a length that cannot produce an id', () => {
		expect(() => UuidHelper.randomId(0)).toThrow('positive integer');
		expect(() => UuidHelper.randomId(-1)).toThrow('positive integer');
		expect(() => UuidHelper.randomId(2.5)).toThrow('positive integer');
	});

	it('rejects an alphabet with nothing to choose from', () => {
		expect(() => UuidHelper.randomId(5, 'a')).toThrow('at least two characters');
	});

	it('does not repeat itself at a realistic length', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => UuidHelper.randomId(12)));
		expect(ids.size).toBe(1000);
	});
});
