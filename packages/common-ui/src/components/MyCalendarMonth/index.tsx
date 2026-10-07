import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import { addMonths, dateToDateString, getMonthGrid, orderWeekdayLabels, parseYearMonth } from '../../helpers/CalendarMonthHelper';

/**
 * MyCalendarMonth — a dependency-free month calendar (plain Views, no calendar library).
 *
 * Shows one month as a grid with previous/next month buttons; tapping a day calls
 * `onSelect` with `YYYY-MM-DD`. Texts (month and weekday names, button labels) come
 * from the app; {@link MY_CALENDAR_MONTH_FALLBACK_TEXTS} keeps the playbook working.
 */

export interface MyCalendarMonthTexts {
	/** Twelve month names, January first. */
	monthNames: readonly string[];
	/** Seven short weekday names, Sunday first (matches `Date.getDay()`). */
	weekdayShortNames: readonly string[];
	previousMonth: string;
	nextMonth: string;
}

export const MY_CALENDAR_MONTH_FALLBACK_TEXTS: MyCalendarMonthTexts = {
	monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	weekdayShortNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
	previousMonth: 'Previous month',
	nextMonth: 'Next month',
};

export type MyCalendarMonthProps = {
	/** Selected day as `YYYY-MM-DD`; also decides which month is shown first. */
	selectedDate?: string | null;
	onSelect: (dateString: string) => void;
	/** 0 = Sunday, 1 = Monday (default), … 6 = Saturday. */
	firstDayOfWeek?: number;
	primaryColor?: string;
	texts?: MyCalendarMonthTexts;
};

const CELL_SIZE = 40;

const MyCalendarMonth: React.FC<MyCalendarMonthProps> = ({ selectedDate, onSelect, firstDayOfWeek = 1, primaryColor, texts = MY_CALENDAR_MONTH_FALLBACK_TEXTS }) => {
	const { theme, isDark } = useTheme();
	const accent = primaryColor ?? theme.primary;
	const accentText = myContrastColor(accent, theme, isDark);
	const today = dateToDateString(new Date());

	const [visibleMonth, setVisibleMonth] = useState(() => {
		const parsed = parseYearMonth(selectedDate);
		if (parsed) return parsed;
		const now = new Date();
		return { year: now.getFullYear(), monthIndex: now.getMonth() };
	});

	const rows = useMemo(() => getMonthGrid(visibleMonth.year, visibleMonth.monthIndex, firstDayOfWeek), [visibleMonth, firstDayOfWeek]);
	const weekdayLabels = useMemo(() => orderWeekdayLabels(texts.weekdayShortNames, firstDayOfWeek), [texts.weekdayShortNames, firstDayOfWeek]);

	const changeMonth = (delta: number) => {
		setVisibleMonth(current => addMonths(current.year, current.monthIndex, delta));
	};

	const monthTitle = `${texts.monthNames[visibleMonth.monthIndex] ?? ''} ${visibleMonth.year}`;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity style={[styles.navButton, { backgroundColor: accent }]} onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel={texts.previousMonth}>
					<MaterialCommunityIcons name="chevron-left" size={22} color={accentText} />
				</TouchableOpacity>
				<Text style={[styles.monthTitle, { color: theme.screen.text }]}>{monthTitle}</Text>
				<TouchableOpacity style={[styles.navButton, { backgroundColor: accent }]} onPress={() => changeMonth(1)} accessibilityRole="button" accessibilityLabel={texts.nextMonth}>
					<MaterialCommunityIcons name="chevron-right" size={22} color={accentText} />
				</TouchableOpacity>
			</View>
			<View style={styles.row}>
				{weekdayLabels.map((label, index) => (
					<View key={`${label}-${index}`} style={styles.cell}>
						<Text style={[styles.weekdayText, { color: theme.screen.placeholder }]}>{label}</Text>
					</View>
				))}
			</View>
			{rows.map((row, rowIndex) => (
				<View key={`row-${rowIndex}`} style={styles.row}>
					{row.map((cell, cellIndex) => {
						if (!cell) {
							return <View key={`empty-${rowIndex}-${cellIndex}`} style={styles.cell} />;
						}
						const isSelected = cell.dateString === selectedDate;
						const isToday = cell.dateString === today;
						return (
							<View key={cell.dateString} style={styles.cell}>
								<TouchableOpacity style={[styles.dayButton, isSelected && { backgroundColor: accent }, !isSelected && isToday && { borderWidth: 2, borderColor: accent }]} onPress={() => onSelect(cell.dateString)} accessibilityRole="button" accessibilityState={{ selected: isSelected }} accessibilityLabel={`${cell.day}. ${monthTitle}`}>
									<Text style={[styles.dayText, { color: isSelected ? accentText : theme.screen.text }, (isSelected || isToday) && styles.dayTextBold]}>{cell.day}</Text>
								</TouchableOpacity>
							</View>
						);
					})}
				</View>
			))}
		</View>
	);
};

export default MyCalendarMonth;

const styles = StyleSheet.create({
	container: {
		width: '100%',
		maxWidth: 420,
		alignSelf: 'center',
		paddingVertical: 8,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	navButton: {
		width: 40,
		height: 40,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	monthTitle: {
		fontSize: 17,
		fontWeight: '700',
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	cell: {
		flex: 1,
		height: CELL_SIZE + 4,
		alignItems: 'center',
		justifyContent: 'center',
	},
	weekdayText: {
		fontSize: 12,
		fontWeight: '600',
	},
	dayButton: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		borderRadius: CELL_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dayText: {
		fontSize: 15,
	},
	dayTextBold: {
		fontWeight: '700',
	},
});
