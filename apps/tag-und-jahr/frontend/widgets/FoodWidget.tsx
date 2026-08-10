import { HStack, Image, Rectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, padding, resizable } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Experimental widget: a pure photo grid of today's meals - square,
// edge-to-edge images with a light 2pt gap. No corner radius on the tiles:
// the widget's own mask rounds the outer corners, and the tiles may bleed
// slightly past the edge (the canvas estimate errs on the large side).
// Incomplete pages are padded with placeholder tiles so e.g. 3 meals on a
// square widget render as a 2x2 grid with one dummy cell instead of a
// centered orphan. Auto-pagination happens via timeline entries (see
// helpers/widgetSync.ts).
export type FoodWidgetProps = {
	/** Meals of the current page; imagePath is a file:// photo in the app group. */
	meals?: { name: string; price: string; imagePath?: string }[];
};

const FoodWidgetLayout = (props: FoodWidgetProps, environment: WidgetEnvironment) => {
	'widget';
	// The 'widget' directive isolates this function: no imports and no module
	// scope values are available in here, so colors, sizes and the grid math
	// (mirrors helpers/gridLayout.ts) live inline.
	// NOTE: the widget renderer drops nested arrays inside mixed children, so
	// mapped rows/cells always live in their own stack (sole child = array).
	const isDark = environment.colorScheme === 'dark';
	const backgroundColor = isDark ? '#1e232e' : '#f6f2e9';
	const placeholderColor = isDark ? '#2c3342' : '#e4ddcd';
	const mutedColor = isDark ? '#9aa3b2' : '#8b8677';

	const meals = props.meals ?? [];

	if (meals.length === 0) {
		return (
			<ZStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999 }), containerBackground(backgroundColor, 'widget')]}>
				<Text modifiers={[font({ size: 11 }), foregroundStyle(mutedColor), padding({ all: 8 })]}>
					Keine Daten - in der App unter Einstellungen eine Mensa wählen.
				</Text>
			</ZStack>
		);
	}

	// Canvas estimates err on the LARGE side so the grid always covers the
	// whole widget - overflow is clipped by the widget mask (deliberate bleed).
	const family = environment.widgetFamily;
	const isMedium = family === 'systemMedium';
	const isLarge = family === 'systemLarge' || family === 'systemExtraLarge';
	const canvasWidth = isLarge ? 358 : isMedium ? 348 : 160;
	const canvasHeight = isLarge ? 358 : 160;
	const spacing = 2;

	// Grid math - mirrors helpers/gridLayout.ts: square cells covering the
	// whole canvas in both dimensions (tiles may bleed, the widget mask
	// clips), picking the (columns, rows) combination with the least total
	// overshoot. The grid is always filled up completely with placeholders.
	const count = meals.length;
	let columns = count;
	let rows = 1;
	let cellSize = canvasHeight;
	let bestOvershoot = Number.POSITIVE_INFINITY;
	for (let tryRows = 1; tryRows <= count; tryRows++) {
		const tryColumns = Math.ceil(count / tryRows);
		const tryCell = Math.ceil(
			Math.max((canvasWidth - spacing * (tryColumns - 1)) / tryColumns, (canvasHeight - spacing * (tryRows - 1)) / tryRows)
		);
		const overshoot = tryColumns * tryCell + spacing * (tryColumns - 1) - canvasWidth + (tryRows * tryCell + spacing * (tryRows - 1) - canvasHeight);
		if (overshoot < bestOvershoot) {
			bestOvershoot = overshoot;
			columns = tryColumns;
			rows = tryRows;
			cellSize = tryCell;
		}
	}

	// Pad to the full grid with null placeholders, then chunk into rows.
	const cells: ({ name: string; imagePath?: string } | null)[] = [];
	for (let index = 0; index < columns * rows; index++) {
		cells.push(index < count ? meals[index] : null);
	}
	const gridRows: (typeof cells)[] = [];
	for (let index = 0; index < cells.length; index += columns) {
		gridRows.push(cells.slice(index, index + columns));
	}

	return (
		<ZStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999 }), containerBackground(backgroundColor, 'widget')]}>
			<VStack spacing={spacing}>
				{gridRows.map((row, rowIndex) => (
					<HStack key={`row-${rowIndex}`} spacing={spacing}>
						{row.map((meal, cellIndex) => (
							<ZStack key={`cell-${rowIndex}-${cellIndex}`} modifiers={[frame({ width: cellSize, height: cellSize })]}>
								{meal?.imagePath ? (
									<Image uiImage={meal.imagePath} modifiers={[resizable(), frame({ width: cellSize, height: cellSize })]} />
								) : (
									<ZStack modifiers={[frame({ width: cellSize, height: cellSize })]}>
										<Rectangle modifiers={[frame({ width: cellSize, height: cellSize }), foregroundStyle(placeholderColor)]} />
										{meal ? <Image systemName="fork.knife" size={Math.max(12, cellSize * 0.25)} color={mutedColor} /> : null}
									</ZStack>
								)}
							</ZStack>
						))}
					</HStack>
				))}
			</VStack>
		</ZStack>
	);
};

// The name must match the widget entry in app.config.ts (expo-widgets plugin).
export default createWidget<FoodWidgetProps>('FoodWidget', FoodWidgetLayout);
