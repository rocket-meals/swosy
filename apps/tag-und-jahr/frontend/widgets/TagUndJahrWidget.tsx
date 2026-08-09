import { Circle, Capsule, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, foregroundStyle, frame, offset, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// The widget needs no props: everything derives from the timeline entry date
// (environment.date). The app only schedules half-hour timeline entries so
// WidgetKit re-renders regularly (see helpers/widgetSync.ts).
export type TagUndJahrWidgetProps = object;

const TagUndJahrWidgetLayout = (_props: TagUndJahrWidgetProps, environment: WidgetEnvironment) => {
	'widget';
	// The 'widget' directive isolates this function: no imports and no module
	// scope values are available in here. The palette, the proportions (see
	// helpers/clockDesign.ts) and the time math (see helpers/clock.ts) are
	// therefore repeated inline - keep them in sync.
	const backgroundColor = '#5d6b85';
	const yearDiscColor = '#e6a83c';
	const dayDiscColor = '#6b4a2c';
	const yearMarkColor = '#c1271c';
	const dayDotColor = '#2fa6a0';
	const dayDotRingColor = '#d8dde4';

	const date = environment.date instanceof Date ? environment.date : new Date();

	// Blue dot: once around per day, clockwise, twelve o'clock at local midnight.
	const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
	const dayAngle = (secondsSinceMidnight / 86400) * 360;

	// Red mark: represents 21 March (start of spring) and travels once around
	// the circle per year - at the start of spring it stands at twelve o'clock.
	const springOfSameYear = new Date(date.getFullYear(), 2, 21);
	const lastSpring = date.getTime() >= springOfSameYear.getTime() ? springOfSameYear : new Date(date.getFullYear() - 1, 2, 21);
	const nextSpring = new Date(lastSpring.getFullYear() + 1, 2, 21);
	const yearAngle = ((date.getTime() - lastSpring.getTime()) / (nextSpring.getTime() - lastSpring.getTime())) * 360;

	// Fixed sizes per family: the widget runtime has no GeometryReader, so the
	// clock diameter is chosen to fit the smallest device variant of each family
	// (content margins are disabled in the app config).
	const family = environment.widgetFamily;
	const diameter = family === 'systemLarge' || family === 'systemExtraLarge' ? 300 : 132;

	return (
		<ZStack
			modifiers={[
				frame({ maxWidth: 9999, maxHeight: 9999 }),
				background(backgroundColor),
				containerBackground(backgroundColor, 'widget'),
			]}
		>
			<Circle modifiers={[frame({ width: diameter, height: diameter }), foregroundStyle(yearDiscColor)]} />
			<Circle modifiers={[frame({ width: diameter * 0.64, height: diameter * 0.64 }), foregroundStyle(dayDiscColor)]} />
			<Capsule
				modifiers={[
					frame({ width: diameter * 0.035, height: diameter * 0.1 }),
					foregroundStyle(yearMarkColor),
					offset({ y: -diameter * 0.41 }),
					rotationEffect(yearAngle),
				]}
			/>
			<Circle
				modifiers={[
					frame({ width: diameter * 0.072, height: diameter * 0.072 }),
					foregroundStyle(dayDotRingColor),
					offset({ y: -diameter * 0.2 }),
					rotationEffect(dayAngle),
				]}
			/>
			<Circle
				modifiers={[
					frame({ width: diameter * 0.056, height: diameter * 0.056 }),
					foregroundStyle(dayDotColor),
					offset({ y: -diameter * 0.2 }),
					rotationEffect(dayAngle),
				]}
			/>
		</ZStack>
	);
};

// The name must match the widget entry in app.config.ts (expo-widgets plugin).
export default createWidget<TagUndJahrWidgetProps>('TagUndJahrWidget', TagUndJahrWidgetLayout);
