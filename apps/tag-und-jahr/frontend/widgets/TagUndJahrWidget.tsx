import { Circle, Capsule, Rectangle, ZStack } from '@expo/ui/swift-ui';
import { background, clipShape, containerBackground, foregroundStyle, frame, offset, rotationEffect } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Display options arrive as timeline props (a widget cannot read the app
// storage): year start anchor and the day display theme. Defaults match the
// original design (spring start, progress dot).
export type TagUndJahrWidgetProps = {
	yearStart?: 'spring' | 'newyear';
	dayDisplay?: 'progress' | 'sunmoon';
};

const TagUndJahrWidgetLayout = (props: TagUndJahrWidgetProps, environment: WidgetEnvironment) => {
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
	const skyColor = '#4f7fb5';
	const earthColor = '#6b4a2c';
	const horizonColor = '#e8e4da';
	const sunColor = '#f5c84c';
	const moonColor = '#f2f0ea';

	const date = environment.date instanceof Date ? environment.date : new Date();
	const yearStart = props.yearStart === 'newyear' ? 'newyear' : 'spring';
	const dayDisplay = props.dayDisplay === 'sunmoon' ? 'sunmoon' : 'progress';

	// Day fraction since local midnight (mirrors helpers/clock.ts).
	const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
	const dayFraction = secondsSinceMidnight / 86400;
	const dayAngle = dayFraction * 360;

	// Red year mark: 'spring' anchors 21 March at twelve o'clock, 'newyear'
	// anchors 1 January there. One revolution per year either way.
	let yearAngle: number;
	if (yearStart === 'newyear') {
		const startOfYear = new Date(date.getFullYear(), 0, 1);
		const startOfNextYear = new Date(date.getFullYear() + 1, 0, 1);
		yearAngle = ((date.getTime() - startOfYear.getTime()) / (startOfNextYear.getTime() - startOfYear.getTime())) * 360;
	} else {
		const springOfSameYear = new Date(date.getFullYear(), 2, 21);
		const lastSpring = date.getTime() >= springOfSameYear.getTime() ? springOfSameYear : new Date(date.getFullYear() - 1, 2, 21);
		const nextSpring = new Date(lastSpring.getFullYear() + 1, 2, 21);
		yearAngle = ((date.getTime() - lastSpring.getTime()) / (nextSpring.getTime() - lastSpring.getTime())) * 360;
	}

	// Sun/moon: one clockwise revolution per 24h, anchored at the LEFT horizon
	// point at 06:00 (12:00 = top, 18:00 = right, night = below the horizon).
	// The moon is the same motion shifted by 12 hours.
	const sunAngle = ((((dayFraction * 24 - 6 + 24) % 24) / 24) * 360);
	const moonAngle = (sunAngle + 180) % 360;

	// Fixed sizes per family: the widget runtime has no GeometryReader, so the
	// clock diameter is chosen to fit the smallest device variant of each family
	// (content margins are disabled in the app config).
	const family = environment.widgetFamily;
	const diameter = family === 'systemLarge' || family === 'systemExtraLarge' ? 300 : 132;
	const innerDiameter = diameter * 0.64;
	const bodySize = innerDiameter * 0.14;
	const orbitRadius = innerDiameter * 0.36;

	return (
		<ZStack
			modifiers={[
				frame({ maxWidth: 9999, maxHeight: 9999 }),
				background(backgroundColor),
				containerBackground(backgroundColor, 'widget'),
			]}
		>
			<Circle modifiers={[frame({ width: diameter, height: diameter }), foregroundStyle(yearDiscColor)]} />
			{dayDisplay === 'sunmoon' ? (
				<ZStack modifiers={[frame({ width: innerDiameter, height: innerDiameter }), clipShape('circle')]}>
					<Circle modifiers={[frame({ width: innerDiameter, height: innerDiameter }), foregroundStyle(skyColor)]} />
					<Circle
						modifiers={[
							frame({ width: bodySize, height: bodySize }),
							foregroundStyle(sunColor),
							offset({ x: -orbitRadius }),
							rotationEffect(sunAngle),
						]}
					/>
					<Circle
						modifiers={[
							frame({ width: bodySize, height: bodySize }),
							foregroundStyle(moonColor),
							offset({ x: -orbitRadius }),
							rotationEffect(moonAngle),
						]}
					/>
					<Rectangle
						modifiers={[frame({ width: innerDiameter, height: innerDiameter / 2 }), foregroundStyle(earthColor), offset({ y: innerDiameter / 4 })]}
					/>
					<Rectangle modifiers={[frame({ width: innerDiameter, height: 1.5 }), foregroundStyle(horizonColor)]} />
				</ZStack>
			) : (
				<ZStack modifiers={[frame({ width: innerDiameter, height: innerDiameter })]}>
					<Circle modifiers={[frame({ width: innerDiameter, height: innerDiameter }), foregroundStyle(dayDiscColor)]} />
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
			)}
			<Capsule
				modifiers={[
					frame({ width: diameter * 0.035, height: diameter * 0.1 }),
					foregroundStyle(yearMarkColor),
					offset({ y: -diameter * 0.41 }),
					rotationEffect(yearAngle),
				]}
			/>
		</ZStack>
	);
};

// The name must match the widget entry in app.config.ts (expo-widgets plugin).
export default createWidget<TagUndJahrWidgetProps>('TagUndJahrWidget', TagUndJahrWidgetLayout);
