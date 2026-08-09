import React from 'react';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { getDayAngleDegrees, getYearAngleDegrees } from '../helpers/clock';
import { CLOCK_COLORS, CLOCK_PROPORTIONS } from '../helpers/clockDesign';

export type YearClockProps = {
	/** Rendered width/height in pixels. */
	size: number;
	/** The moment to display. */
	date: Date;
};

/**
 * The in-app rendering of the "Tag und Jahr" clock. The home screen widget
 * (widgets/TagUndJahrWidget.tsx) draws the same design with SwiftUI views.
 */
export default function YearClock({ size, date }: Readonly<YearClockProps>) {
	const center = size / 2;
	const yearAngle = getYearAngleDegrees(date);
	const dayAngle = getDayAngleDegrees(date);

	const markWidth = CLOCK_PROPORTIONS.yearMarkWidth * size;
	const markHeight = CLOCK_PROPORTIONS.yearMarkHeight * size;
	const markCenterY = center - CLOCK_PROPORTIONS.yearMarkCenterRadius * size;
	const dotCenterY = center - CLOCK_PROPORTIONS.dayDotCenterRadius * size;

	return (
		<Svg width={size} height={size}>
			<Circle cx={center} cy={center} r={size / 2} fill={CLOCK_COLORS.yearDisc} />
			<Circle cx={center} cy={center} r={(CLOCK_PROPORTIONS.dayDisc * size) / 2} fill={CLOCK_COLORS.dayDisc} />
			<G rotation={yearAngle} origin={`${center}, ${center}`}>
				<Rect
					x={center - markWidth / 2}
					y={markCenterY - markHeight / 2}
					width={markWidth}
					height={markHeight}
					rx={markWidth / 2}
					fill={CLOCK_COLORS.yearMark}
				/>
			</G>
			<G rotation={dayAngle} origin={`${center}, ${center}`}>
				<Circle cx={center} cy={dotCenterY} r={(CLOCK_PROPORTIONS.dayDotRing * size) / 2} fill={CLOCK_COLORS.dayDotRing} />
				<Circle cx={center} cy={dotCenterY} r={(CLOCK_PROPORTIONS.dayDot * size) / 2} fill={CLOCK_COLORS.dayDot} />
			</G>
		</Svg>
	);
}
