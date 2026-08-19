import { MathHelper } from '../MathHelper';

describe('MathHelper.random', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('stays within [0, 1)', () => {
		for (let i = 0; i < 1000; i++) {
			const value = MathHelper.random();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it('produces varying values', () => {
		const values = new Set(Array.from({ length: 100 }, () => MathHelper.random()));
		expect(values.size).toBeGreaterThan(1);
	});

	it('is the single seam for randomness – stubbing it makes callers deterministic', () => {
		jest.spyOn(MathHelper, 'random').mockReturnValue(0.42);
		expect(MathHelper.random()).toBe(0.42);
	});
});
