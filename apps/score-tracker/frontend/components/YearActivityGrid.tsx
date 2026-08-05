import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'repo-depkit-common-ui';
import type { YearActivityGridData } from '../helpers/StatsHelper';

// ─── GitHub-style year activity grid ──────────────────────────────────────────
//
// 52 week rows of 7 cells (Monday→Sunday), green when something was played
// that day and grey when not - like GitHub's contribution graph, but turned
// 90°: on a portrait phone the seven weekdays fit side by side while the
// weeks run downwards, newest week first, with the month labels on the left.
// The surrounding modal provides the vertical scrolling.

const CELL_SIZE = 12;
const CELL_GAP = 3;
const COLUMN_WIDTH = CELL_SIZE + CELL_GAP;
const MONTH_COLUMN_WIDTH = 32;

// GitHub's contribution palettes: index 0 = "nothing played", 1-4 = more and
// more matches on that day.
const LIGHT_LEVELS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] as const;
const DARK_LEVELS = ['#2d333b', '#0e4429', '#006d32', '#26a641', '#39d353'] as const;

function levelForCount(count: number): number {
	if (count <= 0) return 0;
	if (count === 1) return 1;
	if (count === 2) return 2;
	if (count <= 4) return 3;
	return 4;
}

// Only every other weekday is labelled (like GitHub), otherwise the header
// would need to fit seven labels onto seven 12px cells.
const WEEKDAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So'] as const;

export type YearActivityGridProps = {
	grid: YearActivityGridData;
	nativeID?: string;
};

export default function YearActivityGrid({ grid, nativeID }: Readonly<YearActivityGridProps>) {
	const { theme, isDark } = useTheme();
	const levels = isDark ? DARK_LEVELS : LIGHT_LEVELS;

	return (
		<View nativeID={nativeID}>
			{/* Legend above the grid, so it is visible without scrolling down 52 rows. */}
			<View style={styles.legendRow}>
				<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>Weniger</Text>
				{levels.map((color) => (
					<View key={color} style={[styles.cell, styles.legendCell, { backgroundColor: color }]} />
				))}
				<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>Mehr</Text>
			</View>
			<View style={styles.weekdayHeaderRow}>
				<View style={styles.monthColumnSpacer} />
				{WEEKDAY_LABELS.map((label, index) => (
					<View key={WEEKDAY_LABELS[index] || `empty-${index}`} style={styles.weekdayLabelCell}>
						<Text style={[styles.axisLabel, styles.weekdayLabelText, { color: theme.screen.placeholder }]}>
							{label}
						</Text>
					</View>
				))}
			</View>
			{grid.weeks.map((week, weekIndex) => (
				<View key={week[0].dayIndex} style={styles.weekRow}>
					<View style={styles.monthLabelCell}>
						{grid.monthLabels[weekIndex] ? (
							<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>
								{grid.monthLabels[weekIndex]}
							</Text>
						) : null}
					</View>
					{week.map((day) => (
						<View
							key={day.dayIndex}
							style={[
								styles.cell,
								{ backgroundColor: day.isFuture ? 'transparent' : levels[levelForCount(day.count)] },
							]}
						/>
					))}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	weekdayHeaderRow: {
		flexDirection: 'row',
		marginBottom: CELL_GAP,
	},
	monthColumnSpacer: {
		width: MONTH_COLUMN_WIDTH,
	},
	weekdayLabelCell: {
		width: CELL_SIZE,
		marginRight: CELL_GAP,
		alignItems: 'center',
	},
	weekdayLabelText: {
		// A "Mo" is wider than its 12px cell - let it overflow evenly to both
		// sides instead of wrapping.
		width: COLUMN_WIDTH + CELL_GAP,
		textAlign: 'center',
	},
	weekRow: {
		flexDirection: 'row',
		marginBottom: CELL_GAP,
	},
	monthLabelCell: {
		width: MONTH_COLUMN_WIDTH,
		justifyContent: 'center',
	},
	cell: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		marginRight: CELL_GAP,
		borderRadius: 3,
	},
	legendCell: {
		marginRight: 0,
	},
	legendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: CELL_GAP,
		marginBottom: 8,
	},
	axisLabel: {
		fontSize: 10,
		fontWeight: '500',
	},
});
