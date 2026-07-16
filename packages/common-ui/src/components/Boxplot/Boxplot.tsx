import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BoxplotStats } from 'repo-depkit-common';
import { useTheme } from '../../context/ThemeContext';
import { lightTheme } from '../../themes';

const PLOT_HEIGHT = 28;
const BOX_HEIGHT = 20;
const CAP_HEIGHT = 14;
const WHISKER_THICKNESS = 2;
const MEDIAN_THICKNESS = 2;

export type BoxplotProps = {
	stats: BoxplotStats;
	/** Color used for whiskers, box border and median line. Defaults to the theme's primary color. */
	color?: string;
	/** Formats a raw value for the min/median/max labels below the plot. Defaults to one decimal place. */
	formatValue?: (value: number) => string;
	/** Hides the min/median/max labels below the plot when false. Defaults to true. */
	showLabels?: boolean;
};

/**
 * Horizontal boxplot rendered with plain Views (no charting library).
 * The whiskers span min→max, the box spans the lower→upper quartile (Q1→Q3),
 * and the vertical line inside the box marks the median.
 */
const Boxplot: React.FC<BoxplotProps> = ({ stats, color, formatValue, showLabels = true }) => {
	const { theme } = useTheme();
	const resolvedColor = color ?? theme.primary ?? lightTheme.primary;
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
				<View style={[styles.whiskerLine, { backgroundColor: resolvedColor }]} />
				<View style={[styles.cap, { left: 0, backgroundColor: resolvedColor }]} />
				<View style={[styles.cap, styles.capRight, { backgroundColor: resolvedColor }]} />
				<View
					style={[
						styles.box,
						{
							left: `${q1Percent}%` as `${number}%`,
							width: `${boxWidthPercent}%` as `${number}%`,
							borderColor: resolvedColor,
							backgroundColor: resolvedColor + '33',
						},
					]}
				/>
				<View
					style={[
						styles.median,
						{ left: `${medianPercent}%` as `${number}%`, backgroundColor: resolvedColor },
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
	whiskerLine: {
		position: 'absolute',
		left: 0,
		right: 0,
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
