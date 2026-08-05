import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'repo-depkit-common-ui';
import type { YearActivityGridData } from '../helpers/StatsHelper';

// ─── GitHub-style year activity grid ──────────────────────────────────────────
//
// 52 week columns of 7 cells (Monday→Sunday), green when something was played
// that day and grey when not - like GitHub's contribution graph. The grid is
// wider than the screen and scrolls horizontally, starting at the most recent
// week (the scroll view jumps to its end once laid out).

const CELL_SIZE = 12;
const CELL_GAP = 3;
const COLUMN_WIDTH = CELL_SIZE + CELL_GAP;
const MONTH_ROW_HEIGHT = 16;

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

// Only every other weekday is labelled (like GitHub), otherwise the column
// would need to fit seven lines of text into seven 12px cells.
const WEEKDAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So'] as const;

export type YearActivityGridProps = {
	grid: YearActivityGridData;
	nativeID?: string;
};

export default function YearActivityGrid({ grid, nativeID }: Readonly<YearActivityGridProps>) {
	const { theme, isDark } = useTheme();
	const scrollRef = useRef<ScrollView>(null);
	const levels = isDark ? DARK_LEVELS : LIGHT_LEVELS;
	const gridWidth = grid.weeks.length * COLUMN_WIDTH;

	return (
		<View nativeID={nativeID}>
			<View style={styles.gridRow}>
				<View style={styles.weekdayColumn}>
					<View style={styles.monthRowSpacer} />
					{WEEKDAY_LABELS.map((label, index) => (
						<View key={WEEKDAY_LABELS[index] || `empty-${index}`} style={styles.weekdayLabelCell}>
							<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>{label}</Text>
						</View>
					))}
				</View>
				<ScrollView
					ref={scrollRef}
					horizontal
					showsHorizontalScrollIndicator={false}
					onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
				>
					<View>
						{/* Month labels absolutely positioned over the columns - a label
						    ("Jan", …) is wider than its 15px column, so it must be allowed
						    to overflow into the following (label-free) columns. */}
						<View style={[styles.monthRow, { width: gridWidth }]}>
							{grid.monthLabels.map((label, week) =>
								label ? (
									<Text
										key={grid.weeks[week][0].dayIndex}
										style={[styles.axisLabel, styles.monthLabel, { left: week * COLUMN_WIDTH, color: theme.screen.placeholder }]}
									>
										{label}
									</Text>
								) : null,
							)}
						</View>
						<View style={styles.weeksRow}>
							{grid.weeks.map((week) => (
								<View key={week[0].dayIndex} style={styles.weekColumn}>
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
					</View>
				</ScrollView>
			</View>
			<View style={styles.legendRow}>
				<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>Weniger</Text>
				{levels.map((color) => (
					<View key={color} style={[styles.cell, styles.legendCell, { backgroundColor: color }]} />
				))}
				<Text style={[styles.axisLabel, { color: theme.screen.placeholder }]}>Mehr</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	gridRow: {
		flexDirection: 'row',
	},
	weekdayColumn: {
		marginRight: 6,
	},
	monthRowSpacer: {
		height: MONTH_ROW_HEIGHT,
	},
	weekdayLabelCell: {
		height: CELL_SIZE,
		marginBottom: CELL_GAP,
		justifyContent: 'center',
	},
	monthRow: {
		height: MONTH_ROW_HEIGHT,
	},
	monthLabel: {
		position: 'absolute',
		top: 0,
	},
	weeksRow: {
		flexDirection: 'row',
	},
	weekColumn: {
		width: COLUMN_WIDTH,
	},
	cell: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		marginBottom: CELL_GAP,
		borderRadius: 3,
	},
	legendCell: {
		marginBottom: 0,
	},
	legendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: CELL_GAP,
		marginTop: 6,
	},
	axisLabel: {
		fontSize: 10,
		fontWeight: '500',
	},
});
