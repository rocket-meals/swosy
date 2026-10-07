import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { myContrastColor } from '@/helper/ColorHelper';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';
import { darkTheme } from '@/styles/themes';
import { CourseTimetableEvent, CourseTimetableWeekday, PositionedEvent, layoutDayEvents, timeToMinutes } from '@/helper/courseTimetable/CourseTimetableModel';
import type { LunchSuggestion } from '@/hooks/useCourseTimetableLunchSuggestions';
import { useCourseEventColors } from './CourseEventDetailsSheet';
import { NOW_COLOR } from './CourseTimetableDayView';

export type WeekViewDay = {
	dateString: string;
	weekday: CourseTimetableWeekday;
	shortLabel: string;
	dayNumber: number;
	isToday: boolean;
	events: CourseTimetableEvent[];
};

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;

/** Hour range shown in the grid: at least 08–18, widened to fit every event. */
export function getVisibleHourRange(events: CourseTimetableEvent[]): { startHour: number; endHour: number } {
	let startHour = DEFAULT_START_HOUR;
	let endHour = DEFAULT_END_HOUR;
	for (const event of events) {
		startHour = Math.min(startHour, Math.floor(timeToMinutes(event.start) / 60));
		endHour = Math.max(endHour, Math.ceil(timeToMinutes(event.end) / 60));
	}
	return { startHour, endHour: Math.min(24, endHour) };
}

const EventBlock: React.FC<{ event: PositionedEvent; top: number; height: number; compact: boolean; onPress: () => void }> = ({ event, top, height, compact, onPress }) => {
	const colors = useCourseEventColors(event.color);
	const width = 100 / event.laneCount;
	return (
		<TouchableOpacity
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${event.title}, ${event.start}–${event.end}${event.location ? `, ${event.location}` : ''}`}
			style={[
				styles.block,
				{
					top,
					height,
					left: `${event.lane * width}%`,
					width: `${width}%`,
				},
			]}
		>
			<View style={[styles.blockInner, compact && styles.blockInnerCompact, { backgroundColor: colors.background }]}>
				<View style={styles.blockTitleRow}>
					<Text style={[compact ? styles.blockTitleCompact : styles.blockTitle, { color: colors.text }]} numberOfLines={compact ? 3 : 2}>
						{event.title}
					</Text>
					{!compact && event.laneCount === 1 && event.source === 'import' ? <MaterialCommunityIcons name="sync" size={13} color={colors.text} /> : null}
				</View>
				{!compact ? <Text style={[styles.blockMeta, { color: colors.text }]}>{`${event.start}–${event.end}`}</Text> : null}
				{event.location ? (
					<Text style={[compact ? styles.blockMetaCompact : styles.blockMeta, { color: colors.text }]} numberOfLines={1}>
						{event.location}
					</Text>
				) : null}
			</View>
		</TouchableOpacity>
	);
};

type CourseTimetableWeekViewProps = {
	days: WeekViewDay[];
	lunches: Record<string, LunchSuggestion | null>;
	/** Minutes since midnight, shown as a line in today's column. */
	nowMinutes: number;
	compact: boolean;
	onOpenEvent: (id: string) => void;
	onOpenLunch: (dateString: string) => void;
};

const CourseTimetableWeekView: React.FC<CourseTimetableWeekViewProps> = ({ days, lunches, nowMinutes, compact, onOpenEvent, onOpenLunch }) => {
	const { theme } = useTheme();
	const isDark = theme === darkTheme;
	const { translate } = useLanguage();
	const { primaryColor, appSettings } = useAppSelector(state => state.settings);
	const accentColor = appSettings?.course_timetable_area_color || primaryColor;
	const accentText = myContrastColor(accentColor, theme, isDark);

	const hourHeight = compact ? 52 : 58;
	const allEvents = useMemo(() => days.flatMap(day => day.events), [days]);
	const { startHour, endHour } = getVisibleHourRange(allEvents);
	const gridHeight = (endHour - startHour) * hourHeight;
	const hours = useMemo(() => Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index), [startHour, endHour]);
	const toY = (minutes: number) => ((minutes - startHour * 60) / 60) * hourHeight;
	const columnGap = compact ? 4 : 8;
	const timeColumnWidth = compact ? 40 : 56;
	const showNow = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

	return (
		<View>
			<View style={[styles.headerRow, { paddingLeft: timeColumnWidth, gap: columnGap }]}>
				{days.map(day => (
					<View key={day.dateString} style={[styles.headerCell, !compact && styles.headerCellWide]}>
						<Text style={[styles.headerWeekday, { color: theme.screen.placeholder }]}>{day.shortLabel}</Text>
						<View style={[styles.dayNumber, day.isToday && { backgroundColor: accentColor }]}>
							<Text style={[styles.dayNumberText, { color: day.isToday ? accentText : theme.screen.text }]}>{day.dayNumber}</Text>
						</View>
					</View>
				))}
			</View>
			<View style={styles.gridRow}>
				<View style={{ width: timeColumnWidth, height: gridHeight }}>
					{hours.map(hour => (
						<Text key={hour} style={[styles.hourLabel, { top: (hour - startHour) * hourHeight - 8, color: theme.screen.placeholder, right: compact ? 6 : 10 }]}>
							{`${String(hour).padStart(2, '0')}:00`}
						</Text>
					))}
				</View>
				<View style={[styles.columns, { gap: columnGap, height: gridHeight }]}>
					{days.map(day => {
						const laidOut = layoutDayEvents(day.events);
						const lunch = lunches[day.dateString];
						return (
							<View key={day.dateString} style={[styles.column, { height: gridHeight, backgroundColor: day.isToday ? theme.screen.iconBg : 'transparent' }]}>
								{hours.map(hour => (
									<View key={hour} style={[styles.hourLine, { top: (hour - startHour) * hourHeight, backgroundColor: theme.screen.iconBg }]} />
								))}
								{lunch ? (
									<TouchableOpacity onPress={() => onOpenLunch(day.dateString)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.course_timetable_lunch_suggestion)} style={[styles.lunchBlock, { top: toY(lunch.start) + 2, height: toY(lunch.end) - toY(lunch.start) - 4, borderColor: theme.screen.placeholder }]}>
										<MaterialCommunityIcons name="silverware-fork-knife" size={compact ? 14 : 16} color={theme.screen.placeholder} />
										{!compact && lunch.end - lunch.start >= 45 ? (
											<Text style={[styles.lunchText, { color: theme.screen.placeholder }]} numberOfLines={2}>
												{translate(TranslationKeys.course_timetable_lunch_suggestion)}
											</Text>
										) : null}
									</TouchableOpacity>
								) : null}
								{laidOut.map(event => (
									<EventBlock key={event.id} event={event} top={toY(event.startMinutes) + 1} height={Math.max(18, toY(event.endMinutes) - toY(event.startMinutes) - 2)} compact={compact} onPress={() => onOpenEvent(event.id)} />
								))}
								{day.isToday && showNow ? <View pointerEvents="none" style={[styles.nowLine, { top: toY(nowMinutes) - 1 }]} /> : null}
							</View>
						);
					})}
				</View>
			</View>
		</View>
	);
};

export default CourseTimetableWeekView;

const styles = StyleSheet.create({
	headerRow: {
		flexDirection: 'row',
		paddingBottom: 8,
	},
	headerCell: {
		flex: 1,
		alignItems: 'center',
		gap: 2,
	},
	headerCellWide: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
	},
	headerWeekday: {
		fontSize: 12,
		fontFamily: 'Poppins_600SemiBold',
	},
	dayNumber: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dayNumberText: {
		fontSize: 15,
		fontFamily: 'Poppins_700Bold',
	},
	gridRow: {
		flexDirection: 'row',
		paddingTop: 8,
		paddingBottom: 16,
	},
	hourLabel: {
		position: 'absolute',
		fontSize: 11,
		fontFamily: 'Poppins_400Regular',
	},
	columns: {
		flex: 1,
		flexDirection: 'row',
	},
	column: {
		flex: 1,
		borderRadius: 10,
		position: 'relative',
	},
	hourLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: StyleSheet.hairlineWidth,
	},
	block: {
		position: 'absolute',
		paddingHorizontal: 1,
	},
	blockInner: {
		flex: 1,
		borderRadius: 10,
		paddingHorizontal: 8,
		paddingVertical: 6,
		overflow: 'hidden',
		gap: 2,
	},
	blockInnerCompact: {
		borderRadius: 8,
		paddingHorizontal: 4,
		paddingVertical: 4,
	},
	blockTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 4,
	},
	blockTitle: {
		flex: 1,
		fontSize: 13,
		fontFamily: 'Poppins_700Bold',
		lineHeight: 17,
	},
	blockTitleCompact: {
		flex: 1,
		fontSize: 11,
		fontFamily: 'Poppins_700Bold',
		lineHeight: 13,
	},
	blockMeta: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
	},
	blockMetaCompact: {
		fontSize: 10,
		fontFamily: 'Poppins_400Regular',
	},
	lunchBlock: {
		position: 'absolute',
		left: 2,
		right: 2,
		borderRadius: 10,
		borderWidth: 1.5,
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 2,
		padding: 4,
	},
	lunchText: {
		fontSize: 11,
		fontFamily: 'Poppins_600SemiBold',
		textAlign: 'center',
	},
	nowLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 3,
		borderRadius: 2,
		backgroundColor: NOW_COLOR,
	},
});
