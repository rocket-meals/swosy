// Shared grid geometry of the food widget: used by the in-app preview and
// (inline-duplicated, the 'widget' directive forbids imports) by
// widgets/FoodWidget.tsx - keep both in sync.

export type GridLayout = {
	columns: number;
	rows: number;
	/** Total cells of the full grid; cells beyond the item count are placeholders. */
	cellCount: number;
};

/**
 * Width-driven square grid: the columns fill the full widget width, the row
 * height follows automatically from the square cells - images are never
 * cropped by the widget edge. `rows <= columns` always holds (on wide 2:1
 * canvases twice as many columns), so the grid never grows taller than the
 * widget. The grid is always filled up completely - e.g. 3 items on a square
 * widget become a 2x2 grid with one placeholder cell, never a centered
 * orphan row.
 */
export function computeGridLayout(count: number, wideAspect: boolean): GridLayout {
	if (count <= 0) {
		return { columns: 0, rows: 0, cellCount: 0 };
	}
	const columns = Math.max(1, Math.ceil(Math.sqrt(wideAspect ? count * 2 : count)));
	const rows = Math.max(1, Math.ceil(count / columns));
	return { columns, rows, cellCount: columns * rows };
}
