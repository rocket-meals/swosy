import { HStack, Image, Rectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { containerBackground, cornerRadius, font, foregroundStyle, frame, padding, resizable } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Experimental widget: a pure photo grid of today's meals - no texts, square
// images filling the widget with light spacing. The app fetches the data,
// downloads the photos into the shared app group container and schedules the
// pages as timeline entries: WidgetKit cannot swipe, so the timeline
// auto-paginates instead (10-second steps for the first hour, then
// per-minute; iOS may coalesce sub-minute entries depending on its budget -
// see helpers/widgetSync.ts).
export type FoodWidgetProps = {
	/** Meals of the current page; imagePath is a file:// photo in the app group. */
	meals?: { name: string; price: string; imagePath?: string }[];
};

const FoodWidgetLayout = (props: FoodWidgetProps, environment: WidgetEnvironment) => {
	'widget';
	// The 'widget' directive isolates this function: no imports and no module
	// scope values are available in here, so colors and sizes live inline.
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

	// Grid geometry: content margins are disabled, so the canvas is roughly the
	// full widget. Sizes are conservative estimates of the smallest device
	// variant per family (no GeometryReader in the widget runtime).
	const family = environment.widgetFamily;
	const isMedium = family === 'systemMedium';
	const isLarge = family === 'systemLarge' || family === 'systemExtraLarge';
	const canvasWidth = isLarge ? 322 : isMedium ? 310 : 148;
	const canvasHeight = isLarge ? 322 : 148;
	const spacing = 2;

	// Square-ish grid: on the 2:1 medium widget twice as many columns as rows.
	const count = meals.length;
	const columns = Math.max(1, Math.ceil(Math.sqrt(isMedium ? count * 2 : count)));
	const rows = Math.max(1, Math.ceil(count / columns));
	const cellSize = Math.floor(
		Math.min((canvasWidth - spacing * (columns - 1)) / columns, (canvasHeight - spacing * (rows - 1)) / rows)
	);

	// Chunk the meals into grid rows (plain loops - keep the isolated runtime simple).
	const gridRows: { name: string; imagePath?: string }[][] = [];
	for (let index = 0; index < count; index += columns) {
		gridRows.push(meals.slice(index, index + columns));
	}

	return (
		<ZStack modifiers={[frame({ maxWidth: 9999, maxHeight: 9999 }), containerBackground(backgroundColor, 'widget')]}>
			<VStack spacing={spacing}>
				{gridRows.map((row, rowIndex) => (
					<HStack key={`row-${rowIndex}`} spacing={spacing}>
						{row.map((meal, cellIndex) => (
							<ZStack key={`cell-${rowIndex}-${cellIndex}`} modifiers={[frame({ width: cellSize, height: cellSize })]}>
								{meal.imagePath ? (
									<Image
										uiImage={meal.imagePath}
										modifiers={[resizable(), frame({ width: cellSize, height: cellSize }), cornerRadius(4)]}
									/>
								) : (
									<ZStack modifiers={[frame({ width: cellSize, height: cellSize })]}>
										<Rectangle modifiers={[frame({ width: cellSize, height: cellSize }), foregroundStyle(placeholderColor), cornerRadius(4)]} />
										<Image systemName="fork.knife" size={Math.max(12, cellSize * 0.3)} color={mutedColor} />
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
