import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BoxplotStats } from 'repo-depkit-common';
import { useTheme } from '../../context/ThemeContext';
import { mixColors } from '../../helpers/ColorHelper';

const PLOT_HEIGHT = 32;
const BOX_HEIGHT = 28;
const CAP_HEIGHT = 20;
const WHISKER_THICKNESS = 2;
const MEDIAN_THICKNESS = 3;
const WHISKER_GRADIENT_STEPS = 10;

// Same palette as the speed-colored route line on the map (see speedToColor
// in packages/common-ui/assets/maplibre/index.html): red = lower quartile
// (slowest), green = middle 50%, blue = upper quartile (fastest).
const DEFAULT_LOW_COLOR = '#ef4444';
const DEFAULT_BOX_COLOR = '#22c55e';
const DEFAULT_HIGH_COLOR = '#3b82f6';
const DEFAULT_MEDIAN_COLOR = '#ef4444';

export type BoxplotProps = {
	stats: BoxplotStats;
	/** Color of the box (Q1→Q3, the middle 50% of samples). Defaults to green. */
	boxColor?: string;
	/** Color of the median line inside the box. Defaults to red. */
	medianColor?: string;
	/** Color at the min end of the left whisker; the whisker gradient-interpolates into boxColor. Defaults to red. */
	lowColor?: string;
	/** Color at the max end of the right whisker; the whisker gradient-interpolates from boxColor. Defaults to blue. */
	highColor?: string;
	/** Formats a raw value for the min/median/max labels below the plot. Defaults to one decimal place. */
	formatValue?: (value: number) => string;
	/** Hides the min/median/max labels below the plot when false. Defaults to true. */
	showLabels?: boolean;
};

/**
 * Renders a whisker as a row of small segments that gradient-interpolate between
 * `colorStart` (at `startPercent`) and `colorEnd` (at `endPercent`), since React
 * Native has no built-in linear-gradient primitive.
 */
function renderWhiskerGradient(
	startPercent: number,
	endPercent: number,
	colorStart: string,
	colorEnd: string,
	keyPrefix: string,
) {
	const width = endPercent - startPercent;
	if (width <= 0) return null;
	const segmentWidth = width / WHISKER_GRADIENT_STEPS;
	return Array.from({ length: WHISKER_GRADIENT_STEPS }).map((_, i) => {
		const t = (i + 0.5) / WHISKER_GRADIENT_STEPS;
		return (
			<View
				key={`${keyPrefix}-${i}`}
				style={[
					styles.whiskerSegment,
					{
						left: `${startPercent + i * segmentWidth}%` as `${number}%`,
						width: `${segmentWidth}%` as `${number}%`,
						backgroundColor: mixColors(colorStart, colorEnd, t),
					},
				]}
			/>
		);
	});
}

/**
 * Horizontal boxplot rendered with plain Views (no charting library).
 * The whiskers span min→max, the box spans the lower→upper quartile (Q1→Q3),
 * and the vertical line inside the box marks the median.
 */
const Boxplot: React.FC<BoxplotProps> = ({
	stats,
	boxColor = DEFAULT_BOX_COLOR,
	medianColor = DEFAULT_MEDIAN_COLOR,
	lowColor = DEFAULT_LOW_COLOR,
	highColor = DEFAULT_HIGH_COLOR,
	formatValue,
	showLabels = true,
}) => {
	const { theme } = useTheme();
	const format = formatValue ?? ((value: number) => value.toFixed(1));

	const range = stats.max - stats.min;
	const toPercent = (value: number) => (range > 0 ? ((value - stats.min) / range) * 100 : 50);

	const q1Percent = toPercent(stats.q1);
	const q3Percent = toPercent(stats.q3);
	const medianPercent = toPercent(stats.median);
	const boxWidthPercent = Math.max(q3Percent - q1Percent, 0);

	return (
		<View style={styles.wrapper}>
			<View style={styles.plotArea}>
				{renderWhiskerGradient(0, q1Percent, lowColor, boxColor, 'low')}
				{renderWhiskerGradient(q3Percent, 100, boxColor, highColor, 'high')}
				<View style={[styles.cap, { left: 0, backgroundColor: lowColor }]} />
				<View style={[styles.cap, styles.capRight, { backgroundColor: highColor }]} />
				<View
					style={[
						styles.box,
						{
							left: `${q1Percent}%` as `${number}%`,
							width: `${boxWidthPercent}%` as `${number}%`,
							borderColor: boxColor,
							backgroundColor: boxColor,
						},
					]}
				/>
				<View
					style={[
						styles.median,
						{ left: `${medianPercent}%` as `${number}%`, backgroundColor: medianColor },
					]}
				/>
			</View>
			{showLabels ? (
				<View style={styles.labelsRow}>
					<Text style={[styles.label, styles.labelLeft, { color: theme.screen.icon }]}>{format(stats.min)}</Text>
					<Text style={[styles.label, styles.labelCenter, { color: theme.screen.icon }]}>{format(stats.median)}</Text>
					<Text style={[styles.label, styles.labelRight, { color: theme.screen.icon }]}>{format(stats.max)}</Text>
				</View>
			) : null}
		</View>
	);
};

export default Boxplot;

const styles = StyleSheet.create({
	wrapper: {
		width: '100%',
	},
	plotArea: {
		height: PLOT_HEIGHT,
		justifyContent: 'center',
	},
	whiskerSegment: {
		position: 'absolute',
		height: WHISKER_THICKNESS,
		top: (PLOT_HEIGHT - WHISKER_THICKNESS) / 2,
	},
	cap: {
		position: 'absolute',
		width: 2,
		height: CAP_HEIGHT,
		top: (PLOT_HEIGHT - CAP_HEIGHT) / 2,
	},
	capRight: {
		right: 0,
	},
	box: {
		position: 'absolute',
		height: BOX_HEIGHT,
		top: (PLOT_HEIGHT - BOX_HEIGHT) / 2,
		borderWidth: 1.5,
		borderRadius: 3,
	},
	median: {
		position: 'absolute',
		width: MEDIAN_THICKNESS,
		height: BOX_HEIGHT,
		top: (PLOT_HEIGHT - BOX_HEIGHT) / 2,
	},
	labelsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 6,
	},
	label: {
		fontSize: 11,
		fontWeight: '500',
	},
	labelLeft: {
		textAlign: 'left',
	},
	labelCenter: {
		textAlign: 'center',
	},
	labelRight: {
		textAlign: 'right',
	},
});
