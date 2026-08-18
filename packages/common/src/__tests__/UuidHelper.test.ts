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
