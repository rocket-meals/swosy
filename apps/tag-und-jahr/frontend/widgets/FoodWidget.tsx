import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Experimental widget: shows today's meals of the configured canteen. The app
// fetches the data (settings screen / app start) and schedules it as timeline
// props - WidgetKit cannot swipe, so when there are more meals than fit on one
// "page", the timeline rotates through the pages every 30 minutes instead
// (see helpers/widgetSync.ts).
export type FoodWidgetProps = {
	/** Canteen name shown as the header. */
	title?: string;
	/** Meals of the current page. */
	meals?: { name: string; price: string }[];
	/** Small footer line, e.g. "Seite 1/2 · 12:30". */
	footer?: string;
};

const FoodWidgetLayout = (props: FoodWidgetProps, environment: WidgetEnvironment) => {
	'widget';
	// The 'widget' directive isolates this function: no imports and no module
	// scope values are available in here, so colors and sizes live inline.
	const isDark = environment.colorScheme === 'dark';
	const backgroundColor = isDark ? '#1e232e' : '#f6f2e9';
	const titleColor = isDark ? '#e6a83c' : '#8a5a19';
	const textColor = isDark ? '#f2f0ea' : '#2b2b28';
	const mutedColor = isDark ? '#9aa3b2' : '#8b8677';

	const family = environment.widgetFamily;
	const isSmall = family === 'systemSmall';
	const titleSize = isSmall ? 11 : 13;
	const rowSize = isSmall ? 10 : 12;
	const footerSize = isSmall ? 8 : 10;

	const meals = props.meals ?? [];
	const title = props.title ?? 'Speisen heute';

	return (
		<VStack alignment="leading" spacing={isSmall ? 2 : 4} modifiers={[frame({ maxWidth: 9999, maxHeight: 9999, alignment: 'topLeading' }), padding({ all: isSmall ? 4 : 8 }), containerBackground(backgroundColor, 'widget')]}>
			<Text modifiers={[font({ size: titleSize, weight: 'bold' }), foregroundStyle(titleColor), lineLimit(1)]}>{title}</Text>
			{meals.length === 0 ? (
				<Text modifiers={[font({ size: rowSize }), foregroundStyle(mutedColor)]}>
					Keine Daten - in der App unter Einstellungen eine Mensa wählen.
				</Text>
			) : (
				meals.map((meal, index) => (
					<HStack key={`meal-${index}`} spacing={4}>
						<Text modifiers={[font({ size: rowSize }), foregroundStyle(textColor), lineLimit(isSmall ? 1 : 2)]}>{meal.name}</Text>
						<Spacer />
						{meal.price ? <Text modifiers={[font({ size: rowSize }), foregroundStyle(mutedColor)]}>{meal.price}</Text> : null}
					</HStack>
				))
			)}
			<Spacer />
			{props.footer ? <Text modifiers={[font({ size: footerSize }), foregroundStyle(mutedColor), lineLimit(1)]}>{props.footer}</Text> : null}
		</VStack>
	);
};

// The name must match the widget entry in app.config.ts (expo-widgets plugin).
export default createWidget<FoodWidgetProps>('FoodWidget', FoodWidgetLayout);
