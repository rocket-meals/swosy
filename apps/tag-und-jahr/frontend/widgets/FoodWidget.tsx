import { HStack, Image, Rectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { aspectRatio, clipped, containerBackground, font, foregroundStyle, frame, padding, resizable } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Experimental widget: a pure photo grid of today's meals - square,
// edge-to-edge images with a light 2pt gap, no texts. The cells are
// FLEXIBLE: each one keeps a 1:1 aspect ratio and shares the row width
// equally, so the grid fills the widget width exactly on every device and
// the height follows automatically - images are never cropped by the widget
// edge (fit, never bleed). Incomplete pages are padded with placeholder
// tiles so e.g. 3 meals on a square widget render as a 2x2 grid with one
// dummy cell. Auto-pagination happens via timeline entries (see
// helpers/widgetSync.ts).
export type FoodWidgetProps = {
	/** Meals of the current page; imagePath is a file:// photo in the app group. */
	meals?: { name: string; price: string; imagePath?: string }[];
};

const FoodWidgetLayout = (props: FoodWidgetProps, environment: WidgetEnvironment) => {
	'widget';
	// The 'widget' directive isolates this function: no imports and no module
	// scope values are available in here, so colors and the grid math
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

	// Grid math - mirrors helpers/gridLayout.ts: width-driven square grid,
	// rows <= columns so the grid never exceeds the widget height; on the wide
	// medium widget twice as many columns as rows. Always padded to the full
	// grid with placeholder cells.
	const isMedium = environment.widgetFamily === 'systemMedium';
	const spacing = 2;
	const count = meals.length;
	const columns = Math.max(1, Math.ceil(Math.sqrt(isMedium ? count * 2 : count)));
	const rows = Math.max(1, Math.ceil(count / columns));

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
							<ZStack
								key={`cell-${rowIndex}-${cellIndex}`}
								modifiers={[aspectRatio({ ratio: 1, contentMode: 'fit' }), clipped()]}
							>
								<Rectangle modifiers={[foregroundStyle(placeholderColor)]} />
								{meal?.imagePath ? <Image uiImage={meal.imagePath} modifiers={[resizable()]} /> : null}
								{meal && !meal.imagePath ? <Image systemName="fork.knife" size={16} color={mutedColor} /> : null}
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
