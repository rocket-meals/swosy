import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'repo-depkit-common-ui';
import type { YearActivityGridData } from '../helpers/StatsHelper';

// ─── GitHub-style year activity grid ──────────────────────────────────────────
//
// 52 week rows of 7 cells (Monday→Sunday), green when something was played
// that day and grey when not - like GitHub's contribution graph, but turned
// 90°: on a portrait phone the seven weekdays fit side by side while the
// weeks run downwards, newest week first, with the month labels on the left.
// The cells have no fixed size - each of the seven columns takes an equal
// share of the available width. The surrounding modal provides the vertical
// scrolling and renders YearActivityGridWeekdayHeader as its sticky header,
// so the weekday labels stay visible while scrolling through 52 rows.

const CELL_GAP = 3;
const LEGEND_CELL_SIZE = 12;
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

// The columns are as wide as a seventh of the screen, so unlike GitHub's
// 12px cells there is room to label every weekday.
const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/**
 * The "Mo Di Mi Do Fr Sa So" row above the grid, exported separately so the
 * modal can render it as its sticky header. Uses the same column layout as
 * the grid rows (month label spacer + seven equal columns), so the labels
 * stay aligned with the cells at any width.
 */
export function YearActivityGridWeekdayHeader() {
	const { theme } = useTheme();
	return (
		<View style={[styles.weekdayHeaderRow, { backgroundColor: theme.screen.background }]}>
			<View style={styles.monthColumnSpacer} />
			{WEEKDAY_LABELS.map((label) => (
				<View key={label} style={styles.weekdayLabelCell}>
					<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>{label}</Text>
				</View>
			))}
		</View>
	);
}

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
					<View key={color} style={[styles.legendCell, { backgroundColor: color }]} />
				))}
				<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>Mehr</Text>
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
		gap: CELL_GAP,
		paddingTop: 4,
		paddingBottom: 6,
		// On native the sticky header sits inside the modal's padded scroll
		// content; on web it is rendered outside the scroll view (see
		// MyScrollViewModal) and has to bring the padding itself.
		...(Platform.OS === 'web' ? { paddingHorizontal: 20 } : null),
	},
	monthColumnSpacer: {
		width: MONTH_COLUMN_WIDTH,
	},
	weekdayLabelCell: {
		flex: 1,
		alignItems: 'center',
	},
	weekRow: {
		flexDirection: 'row',
		gap: CELL_GAP,
		marginBottom: CELL_GAP,
	},
	monthLabelCell: {
		width: MONTH_COLUMN_WIDTH,
		justifyContent: 'center',
	},
	cell: {
		flex: 1,
		aspectRatio: 1,
		borderRadius: 3,
	},
	legendCell: {
		width: LEGEND_CELL_SIZE,
		height: LEGEND_CELL_SIZE,
		borderRadius: 3,
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
