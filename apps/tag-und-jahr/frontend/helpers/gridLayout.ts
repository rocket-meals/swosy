// Shared grid geometry of the food widget: used by the in-app preview and
// (inline-duplicated, the 'widget' directive forbids imports) by
// widgets/FoodWidget.tsx - keep both in sync.

export type GridLayout = {
	columns: number;
	rows: number;
	/** Edge length of the square cells. */
	cellSize: number;
	/** Total cells of the full grid; cells beyond the item count are placeholders. */
	cellCount: number;
};

/**
 * Square cells covering the whole canvas: for each possible row count the
 * cell size is chosen so the grid covers the canvas in BOTH dimensions
 * (tiles may bleed past the edge - the widget mask clips them), and the
 * (columns, rows) combination with the least total overshoot wins. The grid
 * is always filled up completely - e.g. 3 items on a square canvas become a
 * 2x2 grid with one placeholder cell, never a centered orphan row.
 */
export function computeGridLayout(count: number, canvasWidth: number, canvasHeight: number, spacing: number): GridLayout {
	if (count <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
		return { columns: 0, rows: 0, cellSize: 0, cellCount: 0 };
	}
	let best: GridLayout = { columns: count, rows: 1, cellSize: canvasHeight, cellCount: count };
	let bestOvershoot = Number.POSITIVE_INFINITY;
	for (let rows = 1; rows <= count; rows++) {
		const columns = Math.ceil(count / rows);
		const cellSize = Math.ceil(
			Math.max((canvasWidth - spacing * (columns - 1)) / columns, (canvasHeight - spacing * (rows - 1)) / rows)
		);
		const gridWidth = columns * cellSize + spacing * (columns - 1);
		const gridHeight = rows * cellSize + spacing * (rows - 1);
		const overshoot = gridWidth - canvasWidth + (gridHeight - canvasHeight);
		if (overshoot < bestOvershoot) {
			bestOvershoot = overshoot;
			best = { columns, rows, cellSize, cellCount: columns * rows };
		}
	}
	return best;
}
