import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { CourseTimetableEvent, layoutDayEvents, minutesToTime } from '@/helper/courseTimetable/CourseTimetableModel';
import type { LunchSuggestion } from '@/hooks/useCourseTimetableLunchSuggestions';
import LunchSuggestionCard from './LunchSuggestionCard';
import { useCourseEventColors } from './CourseEventDetailsSheet';

type DayItem = { type: 'event'; event: CourseTimetableEvent & { overlaps: boolean } } | { type: 'gap'; start: number; end: number } | { type: 'lunch' } | { type: 'now' };

/**
 * Builds the vertical agenda of one day: events in order, a thin "break" line between them,
 * the lunch suggestion in its free block and a "now" marker when the day is today.
 */
export function buildDayItems(events: CourseTimetableEvent[], lunch: { start: number; end: number } | null, nowMinutes: number | null): DayItem[] {
	const laidOut = layoutDayEvents(events);
	const items: DayItem[] = [];
	let lunchPlaced = !lunch;
	let nowPlaced = nowMinutes === null;
	let previousEnd: number | null = null;

	const placeNowBefore = (minute: number) => {
		if (!nowPlaced && nowMinutes !== null && nowMinutes < minute) {
			items.push({ type: 'now' });
			nowPlaced = true;
		}
	};

	for (const event of laidOut) {
		if (!lunchPlaced && lunch && lunch.end <= event.startMinutes) {
			// During the break itself the "now" line sits above the lunch card.
			placeNowBefore(lunch.end);
			items.push({ type: 'lunch' });
			lunchPlaced = true;
		} else if (previousEnd !== null && event.startMinutes > previousEnd) {
			placeNowBefore(event.startMinutes);
			items.push({ type: 'gap', start: previousEnd, end: event.startMinutes });
		}
		placeNowBefore(event.startMinutes);
		items.push({ type: 'event', event });
		previousEnd = Math.max(previousEnd ?? 0, event.endMinutes);
	}
	if (!lunchPlaced) {
		placeNowBefore(lunch?.end ?? 24 * 60);
		items.push({ type: 'lunch' });
	}
	if (!nowPlaced && laidOut.length > 0) {
		items.push({ type: 'now' });
	}
	return items;
}

const EventCard: React.FC<{ event: CourseTimetableEvent & { overlaps: boolean }; onPress: () => void }> = ({ event, onPress }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const colors = useCourseEventColors(event.color);
	const sourceLabel = translate(event.source === 'import' ? TranslationKeys.course_timetable_source_import : TranslationKeys.course_timetable_source_manual);

	return (
		<View style={styles.eventRow}>
			<View style={styles.timeColumn}>
				<Text style={[styles.timeStart, { color: theme.screen.text }]}>{event.start}</Text>
				<Text style={[styles.timeEnd, { color: theme.screen.placeholder }]}>{event.end}</Text>
			</View>
			<TouchableOpacity style={[styles.card, { backgroundColor: colors.background }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${event.title}, ${event.start}–${event.end}${event.location ? `, ${event.location}` : ''}`}>
				<View style={styles.cardTop}>
					<Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
						{event.title}
					</Text>
					<View style={[styles.sourceBadge, { backgroundColor: theme.screen.background }]}>
						<Text style={[styles.sourceText, { color: theme.screen.text }]}>{sourceLabel}</Text>
					</View>
				</View>
				<View style={styles.cardMeta}>
					{event.kind ? <Text style={[styles.metaText, { color: colors.text }]}>{event.kind}</Text> : null}
					{event.location ? (
						<View style={styles.metaLocation}>
							<MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.text} />
							<Text style={[styles.metaText, { color: colors.text }]}>{event.location}</Text>
						</View>
					) : null}
				</View>
				{event.overlaps ? (
					<View style={[styles.overlap, { backgroundColor: theme.screen.text }]}>
						<Text style={[styles.overlapText, { color: theme.screen.background }]}>{translate(TranslationKeys.course_timetable_overlap)}</Text>
					</View>
				) : null}
			</TouchableOpacity>
		</View>
	);
};

type CourseTimetableDayViewProps = {
	events: CourseTimetableEvent[];
	dateString: string;
	/** Minutes since midnight when the shown day is today, otherwise null. */
	nowMinutes: number | null;
	lunch: LunchSuggestion | null | undefined;
	onOpenEvent: (id: string) => void;
};

const CourseTimetableDayView: React.FC<CourseTimetableDayViewProps> = ({ events, dateString, nowMinutes, lunch, onOpenEvent }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const items = useMemo(() => buildDayItems(events, lunch ?? null, nowMinutes), [events, lunch, nowMinutes]);

	return (
		<View style={styles.container}>
			{events.length === 0 ? (
				<View style={[styles.empty, { backgroundColor: theme.screen.iconBg }]}>
					<MaterialCommunityIcons name="calendar-blank-outline" size={28} color={theme.screen.icon} />
					<Text style={[styles.emptyText, { color: theme.screen.text }]}>{translate(TranslationKeys.course_timetable_no_events_day)}</Text>
				</View>
			) : null}
			{items.map((item, index) => {
				switch (item.type) {
					case 'event':
						return <EventCard key={item.event.id} event={item.event} onPress={() => onOpenEvent(item.event.id)} />;
					case 'gap':
						return (
							<View key={`gap-${index}`} style={styles.gap}>
								<View style={[styles.gapLine, { backgroundColor: theme.screen.iconBg }]} />
								<Text style={[styles.gapText, { color: theme.screen.placeholder }]}>{`${translate(TranslationKeys.course_timetable_break)} · ${minutesToTime(item.start)}–${minutesToTime(item.end)}`}</Text>
								<View style={[styles.gapLine, { backgroundColor: theme.screen.iconBg }]} />
							</View>
						);
					case 'lunch':
						return lunch ? (
							<View key="lunch" style={styles.lunch}>
								<LunchSuggestionCard suggestion={lunch} dateString={dateString} />
							</View>
						) : null;
					case 'now':
						return nowMinutes !== null ? (
							<View key="now" style={styles.now}>
								<View style={styles.nowBadge}>
									<Text style={styles.nowText}>{`${translate(TranslationKeys.course_timetable_now)} · ${minutesToTime(nowMinutes)}`}</Text>
								</View>
								<View style={styles.nowLine} />
							</View>
						) : null;
					default:
						return null;
				}
			})}
		</View>
	);
};

export default CourseTimetableDayView;

/** Exposed for the "now" marker colour in the week view. */
export const NOW_COLOR = '#D93B2B';

/** Minutes since midnight of the given Date. */
export function minutesOfDay(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

const TIME_COLUMN_WIDTH = 46;

const styles = StyleSheet.create({
	container: {
		gap: 8,
	},
	empty: {
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		gap: 8,
	},
	emptyText: {
		fontSize: 15,
		fontFamily: 'Poppins_600SemiBold',
		textAlign: 'center',
	},
	eventRow: {
		flexDirection: 'row',
		gap: 12,
	},
	timeColumn: {
		width: TIME_COLUMN_WIDTH,
		alignItems: 'flex-end',
		paddingTop: 12,
	},
	timeStart: {
		fontSize: 13,
		fontFamily: 'Poppins_700Bold',
	},
	timeEnd: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
	},
	card: {
		flex: 1,
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 6,
	},
	cardTop: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: 8,
	},
	cardTitle: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
	sourceBadge: {
		borderRadius: 6,
		paddingHorizontal: 7,
		paddingVertical: 2,
		opacity: 0.85,
	},
	sourceText: {
		fontSize: 11,
		fontFamily: 'Poppins_600SemiBold',
	},
	cardMeta: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 10,
	},
	metaLocation: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	metaText: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
	},
	overlap: {
		alignSelf: 'flex-start',
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	overlapText: {
		fontSize: 12,
		fontFamily: 'Poppins_600SemiBold',
	},
	gap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingLeft: TIME_COLUMN_WIDTH + 12,
	},
	gapLine: {
		flex: 1,
		height: 1,
	},
	gapText: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
	},
	lunch: {
		paddingLeft: TIME_COLUMN_WIDTH + 12,
	},
	now: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	nowBadge: {
		backgroundColor: NOW_COLOR,
		borderRadius: 6,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	nowText: {
		color: '#ffffff',
		fontSize: 12,
		fontFamily: 'Poppins_700Bold',
	},
	nowLine: {
		flex: 1,
		height: 2,
		borderRadius: 1,
		backgroundColor: NOW_COLOR,
	},
});
