import { computeGridLayout } from '../helpers/gridLayout';

describe('computeGridLayout', () => {
	it('lays out 4 items as an exact 2x2 grid on a square canvas', () => {
		const layout = computeGridLayout(4, 160, 160, 2);
		expect(layout.columns).toBe(2);
		expect(layout.rows).toBe(2);
		expect(layout.cellCount).toBe(4);
		expect(layout.cellSize).toBe(79);
	});

	it('pads 3 items on a square canvas to a 2x2 grid with one placeholder', () => {
		const layout = computeGridLayout(3, 160, 160, 2);
		expect(layout.columns).toBe(2);
		expect(layout.rows).toBe(2);
		expect(layout.cellCount).toBe(4);
	});

	it('covers the canvas in both dimensions (bleed, never letterbox)', () => {
		const spacing = 2;
		for (const count of [2, 3, 4, 5, 6, 8]) {
			const layout = computeGridLayout(count, 348, 160, spacing);
			const gridWidth = layout.columns * layout.cellSize + spacing * (layout.columns - 1);
			const gridHeight = layout.rows * layout.cellSize + spacing * (layout.rows - 1);
			expect(gridWidth).toBeGreaterThanOrEqual(348);
			expect(gridHeight).toBeGreaterThanOrEqual(160);
		}
	});

	it('returns an empty layout for zero items', () => {
		expect(computeGridLayout(0, 160, 160, 2).cellCount).toBe(0);
	});
});
