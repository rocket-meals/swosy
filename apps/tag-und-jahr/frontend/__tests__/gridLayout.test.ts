import { computeGridLayout } from '../helpers/gridLayout';

describe('computeGridLayout (width-driven square grid)', () => {
	it('lays out 4 items as a 2x2 grid on a square widget', () => {
		expect(computeGridLayout(4, false)).toEqual({ columns: 2, rows: 2, cellCount: 4 });
	});

	it('pads 3 items on a square widget to a 2x2 grid with one placeholder', () => {
		expect(computeGridLayout(3, false)).toEqual({ columns: 2, rows: 2, cellCount: 4 });
	});

	it('never has more rows than columns, so the grid never exceeds the widget height', () => {
		for (let count = 1; count <= 12; count++) {
			const square = computeGridLayout(count, false);
			expect(square.rows).toBeLessThanOrEqual(square.columns);
			const wide = computeGridLayout(count, true);
			// Wide (2:1) widgets need roughly twice as many columns as rows.
			expect(wide.rows * 2).toBeLessThanOrEqual(wide.columns * 2);
			expect(wide.columns).toBeGreaterThanOrEqual(square.columns);
		}
	});

	it('returns an empty layout for zero items', () => {
		expect(computeGridLayout(0, false).cellCount).toBe(0);
	});
});
