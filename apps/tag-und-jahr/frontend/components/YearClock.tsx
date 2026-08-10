import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, Rect } from 'react-native-svg';
import { getDayAngleDegrees, getMoonAngleDegrees, getSunAngleDegrees, getYearAngleDegreesFor } from '../helpers/clock';
import { ClockSettings, DEFAULT_CLOCK_SETTINGS } from '../helpers/clockSettings';
import { CLOCK_COLORS, CLOCK_PROPORTIONS } from '../helpers/clockDesign';

export type YearClockProps = {
	/** Rendered width/height in pixels. */
	size: number;
	/** The moment to display. */
	date: Date;
	/** Display options (year start anchor, day display theme). */
	settings?: ClockSettings;
};

const SKY_COLOR = '#4f7fb5';
const HORIZON_COLOR = '#e8e4da';
const SUN_COLOR = '#f5c84c';
const MOON_COLOR = '#f2f0ea';

/**
 * The in-app rendering of the "Tag und Jahr" clock. The home screen widget
 * (widgets/TagUndJahrWidget.tsx) draws the same design with SwiftUI views.
 */
export default function YearClock({ size, date, settings = DEFAULT_CLOCK_SETTINGS }: Readonly<YearClockProps>) {
	const center = size / 2;
	const yearAngle = getYearAngleDegreesFor(date, settings.yearStart);
	const dayAngle = getDayAngleDegrees(date);

	const markWidth = CLOCK_PROPORTIONS.yearMarkWidth * size;
	const markHeight = CLOCK_PROPORTIONS.yearMarkHeight * size;
	const markCenterY = center - CLOCK_PROPORTIONS.yearMarkCenterRadius * size;
	const dotCenterY = center - CLOCK_PROPORTIONS.dayDotCenterRadius * size;

	const innerRadius = (CLOCK_PROPORTIONS.dayDisc * size) / 2;
	const bodyRadius = innerRadius * 0.14;
	const orbitRadius = innerRadius * 0.72;
	const sunAngle = getSunAngleDegrees(date);
	const moonAngle = getMoonAngleDegrees(date);

	return (
		<Svg width={size} height={size}>
			<Defs>
				<ClipPath id="innerDisc">
					<Circle cx={center} cy={center} r={innerRadius} />
				</ClipPath>
			</Defs>
			<Circle cx={center} cy={center} r={size / 2} fill={CLOCK_COLORS.yearDisc} />
			{settings.dayDisplay === 'sunmoon' ? (
				<G clipPath="#innerDisc">
					<Circle cx={center} cy={center} r={innerRadius} fill={SKY_COLOR} />
					{/* Sun/moon: one revolution per 24h, anchored left at 06:00. */}
					<G rotation={sunAngle} origin={`${center}, ${center}`}>
						<Circle cx={center - orbitRadius} cy={center} r={bodyRadius} fill={SUN_COLOR} />
					</G>
					<G rotation={moonAngle} origin={`${center}, ${center}`}>
						<Circle cx={center - orbitRadius} cy={center} r={bodyRadius} fill={MOON_COLOR} />
					</G>
					{/* Earth covers the lower half, hiding the body below the horizon. */}
					<Rect x={center - innerRadius} y={center} width={innerRadius * 2} height={innerRadius} fill={CLOCK_COLORS.dayDisc} />
					<Line x1={center - innerRadius} y1={center} x2={center + innerRadius} y2={center} stroke={HORIZON_COLOR} strokeWidth={1.5} />
				</G>
			) : (
				<>
					<Circle cx={center} cy={center} r={innerRadius} fill={CLOCK_COLORS.dayDisc} />
					<G rotation={dayAngle} origin={`${center}, ${center}`}>
						<Circle cx={center} cy={dotCenterY} r={(CLOCK_PROPORTIONS.dayDotRing * size) / 2} fill={CLOCK_COLORS.dayDotRing} />
						<Circle cx={center} cy={dotCenterY} r={(CLOCK_PROPORTIONS.dayDot * size) / 2} fill={CLOCK_COLORS.dayDot} />
					</G>
				</>
			)}
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
		</Svg>
	);
}
