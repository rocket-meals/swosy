import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MyColorSelection, SettingsListGroupTitle, SettingsListSelectOptionSingle, SettingsListTimeInput, mixColors } from 'repo-depkit-common-ui';
import { myContrastColor } from '@/helper/ColorHelper';
import SettingsList from '@/components/SettingsList';
import ProjectButton from '@/components/ProjectButton';
import DebugView from '@/components/DebugView';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import useMyScrollviewTextInputModal from '@/hooks/useMyScrollviewTextInputModal';
import useBuildingDetailsModal from '@/hooks/useBuildingDetailsModal';
import useCourseTimetable from '@/hooks/useCourseTimetable';
import useCommonUiTexts from '@/hooks/useCommonUiTexts';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';
import { darkTheme } from '@/styles/themes';
import { COURSE_COLOR_SWATCHES, COURSE_TIMETABLE_WEEKDAYS, CourseTimetableEvent, CourseTimetableWeekday, createEventId, findBuildingIdForLocation, minutesToTime, timeToMinutes } from '@/helper/courseTimetable/CourseTimetableModel';

/**
 * Details of one timetable event, shown in the scroll-view modal.
 *
 * The global modal stack only renders its top sheet, so this sheet is unmounted while a
 * nested modal (text input, time, color, weekday) is open. It therefore never keeps the event
 * in local state: saved events are read from the profile by id and every change is saved
 * right away; a new event lives in the module-level draft store below until "save".
 */

export const NEW_COURSE_EVENT_ID = '__new__';

let draftEvent: CourseTimetableEvent | null = null;
const draftListeners = new Set<() => void>();

function emitDraftChange() {
	draftListeners.forEach(listener => listener());
}

export function setCourseEventDraft(event: CourseTimetableEvent | null) {
	draftEvent = event;
	emitDraftChange();
}

function subscribeDraft(listener: () => void) {
	draftListeners.add(listener);
	return () => {
		draftListeners.delete(listener);
	};
}

function getDraft() {
	return draftEvent;
}

/** Blends the event color into the background for a calm card fill; returns fill + readable text color. */
export function useCourseEventColors(color: string) {
	const { theme } = useTheme();
	const isDark = theme === darkTheme;
	return useMemo(() => {
		const tinted = mixColors(color, theme.screen.background, isDark ? 0.55 : 0.78);
		return { background: tinted, text: myContrastColor(tinted, theme, isDark), dot: color };
	}, [color, theme, isDark]);
}

const WEEKDAY_TRANSLATION_KEYS: Record<CourseTimetableWeekday, TranslationKeys> = {
	monday: TranslationKeys.Mon,
	tuesday: TranslationKeys.Tue,
	wednesday: TranslationKeys.Wed,
	thursday: TranslationKeys.Thu,
	friday: TranslationKeys.Fri,
	saturday: TranslationKeys.Sat,
	sunday: TranslationKeys.Sun,
};

export function weekdayTranslationKey(weekday: CourseTimetableWeekday): TranslationKeys {
	return WEEKDAY_TRANSLATION_KEYS[weekday];
}

type CourseEventDetailsSheetProps = {
	eventId: string;
};

const CourseEventDetailsSheet: React.FC<CourseEventDetailsSheetProps> = ({ eventId }) => {
	const { theme } = useTheme();
	const isDark = theme === darkTheme;
	const { translate } = useLanguage();
	const { events, saveEvent, deleteEvent } = useCourseTimetable();
	const draft = useSyncExternalStore(subscribeDraft, getDraft, getDraft);
	const { show, close, closeAll } = useMyScrollViewModal();
	const { openTextInputModal } = useMyScrollviewTextInputModal();
	const { openBuildingDetailsModal } = useBuildingDetailsModal();
	const { colorSelectionTexts } = useCommonUiTexts();
	const { primaryColor, appSettings } = useAppSelector(state => state.settings);
	const buildingsDict = useAppSelector(state => state.canteenReducer.buildingsDict) as Record<string, { id: string; alias?: string | null; external_identifier?: string | null }>;
	const accentColor = appSettings?.course_timetable_area_color || primaryColor;

	const isNew = eventId === NEW_COURSE_EVENT_ID;
	const event = isNew ? draft : (events.find(e => e.id === eventId) ?? null);
	const colors = useCourseEventColors(event?.color ?? COURSE_COLOR_SWATCHES[0] ?? '#3A78D8');

	const buildings = useMemo(() => Object.values(buildingsDict || {}), [buildingsDict]);
	const buildingId = event ? findBuildingIdForLocation(event, buildings) : null;
	const building = buildingId ? buildingsDict[buildingId] : undefined;

	const update = useCallback(
		(changes: Partial<CourseTimetableEvent>) => {
			if (!event) return;
			const next = { ...event, ...changes };
			if (isNew) {
				setCourseEventDraft(next);
			} else {
				saveEvent(next);
			}
		},
		[event, isNew, saveEvent]
	);

	const editText = useCallback(
		(field: 'title' | 'location' | 'kind', title: string) => {
			if (!event) return;
			openTextInputModal({
				title,
				placeholder: title,
				initialValue: event[field] ?? '',
				saveLabel: translate(TranslationKeys.save),
				onSave: (value: string) => update({ [field]: value.trim() }),
			});
		},
		[event, openTextInputModal, translate, update]
	);

	const saveTime = useCallback(
		(field: 'start' | 'end', totalSeconds: number) => {
			if (!event) return;
			const minutes = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalSeconds / 60)));
			const start = timeToMinutes(event.start);
			const end = timeToMinutes(event.end);
			const duration = Math.max(15, end - start);
			// Keep start < end by moving the other boundary along instead of rejecting the input.
			if (field === 'start') {
				const nextEnd = minutes < end ? end : Math.min(23 * 60 + 59, minutes + duration);
				update({ start: minutesToTime(minutes), end: minutesToTime(nextEnd) });
			} else {
				const nextStart = minutes > start ? start : Math.max(0, minutes - duration);
				update({ start: minutesToTime(nextStart), end: minutesToTime(minutes) });
			}
		},
		[event, update]
	);

	const openWeekdaySelection = useCallback(() => {
		if (!event) return;
		show({
			title: translate(TranslationKeys.weekday),
			children: (
				<View>
					{COURSE_TIMETABLE_WEEKDAYS.map((weekday, index) => (
						<SettingsListSelectOptionSingle
							key={weekday}
							label={translate(WEEKDAY_TRANSLATION_KEYS[weekday])}
							isSelected={event.weekday === weekday}
							selectionColor={accentColor}
							groupPosition={index === 0 ? 'top' : index === COURSE_TIMETABLE_WEEKDAYS.length - 1 ? 'bottom' : 'middle'}
							showSeparator={index !== COURSE_TIMETABLE_WEEKDAYS.length - 1}
							onPress={() => {
								update({ weekday });
								close();
							}}
						/>
					))}
				</View>
			),
		});
	}, [accentColor, close, event, show, translate, update]);

	const openColorSelection = useCallback(() => {
		if (!event) return;
		show({
			title: translate(TranslationKeys.color),
			children: (
				<MyColorSelection
					selectedColor={event.color}
					selectionColor={accentColor}
					texts={colorSelectionTexts}
					onSelect={color => {
						update({ color });
						close();
					}}
				/>
			),
		});
	}, [accentColor, close, colorSelectionTexts, event, show, translate, update]);

	const confirmDelete = useCallback(() => {
		if (!event) return;
		show({
			title: translate(TranslationKeys.delete),
			children: (
				<View style={styles.confirm}>
					<Text style={[styles.confirmText, { color: theme.screen.text }]}>{translate(TranslationKeys.course_timetable_delete_event_confirm)}</Text>
					<ProjectButton
						text={translate(TranslationKeys.delete)}
						onPress={() => {
							deleteEvent(event.id);
							closeAll();
						}}
						style={styles.confirmButton}
					/>
					<TouchableOpacity onPress={close} style={styles.cancel} accessibilityRole="button">
						<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.cancel)}</Text>
					</TouchableOpacity>
				</View>
			),
		});
	}, [close, closeAll, deleteEvent, event, show, theme.screen.text, translate]);

	const saveNewEvent = useCallback(() => {
		if (!event) return;
		saveEvent({ ...event, id: createEventId(events), title: event.title.trim() || translate(TranslationKeys.event) });
		setCourseEventDraft(null);
		close();
	}, [close, event, events, saveEvent, translate]);

	if (!event) {
		return null;
	}

	const isImported = event.source === 'import';
	const subtitle = [event.kind, translate(isImported ? TranslationKeys.course_timetable_source_import : TranslationKeys.course_timetable_source_manual)].filter(Boolean).join(' · ');
	const swatches = COURSE_COLOR_SWATCHES.includes(event.color) ? COURSE_COLOR_SWATCHES : [event.color, ...COURSE_COLOR_SWATCHES.slice(0, -1)];
	const pencil = <MaterialCommunityIcons name="pencil" size={20} color={theme.screen.icon} />;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={[styles.headerIcon, { backgroundColor: colors.background }]}>
					<MaterialCommunityIcons name="school-outline" size={26} color={colors.text} />
				</View>
				<View style={styles.headerText}>
					<Text style={[styles.title, { color: theme.screen.text }]} numberOfLines={3}>
						{event.title || translate(TranslationKeys.event)}
					</Text>
					<Text style={[styles.subtitle, { color: theme.screen.placeholder }]}>{subtitle}</Text>
				</View>
			</View>

			{isImported ? (
				<View style={[styles.hint, { backgroundColor: colors.background }]}>
					<MaterialCommunityIcons name="information-outline" size={18} color={colors.text} />
					<Text style={[styles.hintText, { color: colors.text }]}>{translate(TranslationKeys.course_timetable_imported_hint)}</Text>
				</View>
			) : null}

			<SettingsList title={translate(TranslationKeys.title)} value={event.title} leftIcon={<MaterialCommunityIcons name="tag-text-outline" size={20} />} rightIcon={pencil} onPress={() => editText('title', translate(TranslationKeys.title))} groupPosition="top" />
			{building ? (
				<SettingsList
					title={translate(TranslationKeys.location)}
					value={event.location ?? ''}
					leftIcon={<MaterialCommunityIcons name="map-marker-outline" size={20} />}
					onPress={() => openBuildingDetailsModal(building.id)}
					rightElement={
						<View style={styles.locationActions}>
							<MaterialCommunityIcons name="office-building-marker-outline" size={20} color={theme.screen.icon} />
							<TouchableOpacity onPress={() => editText('location', translate(TranslationKeys.location))} accessibilityRole="button" accessibilityLabel={`${translate(TranslationKeys.location)}: ${translate(TranslationKeys.edit)}`} style={styles.inlineEdit}>
								{pencil}
							</TouchableOpacity>
						</View>
					}
					groupPosition="middle"
				/>
			) : (
				<SettingsList title={translate(TranslationKeys.location)} value={event.location ?? ''} leftIcon={<MaterialCommunityIcons name="map-marker-outline" size={20} />} rightIcon={pencil} onPress={() => editText('location', translate(TranslationKeys.location))} groupPosition="middle" />
			)}
			<SettingsList title={translate(TranslationKeys.course_timetable_kind)} value={event.kind ?? ''} leftIcon={<MaterialCommunityIcons name="shape-outline" size={20} />} rightIcon={pencil} onPress={() => editText('kind', translate(TranslationKeys.course_timetable_kind))} groupPosition="middle" />
			<SettingsList title={translate(TranslationKeys.weekday)} value={translate(WEEKDAY_TRANSLATION_KEYS[event.weekday])} leftIcon={<MaterialCommunityIcons name="calendar-week" size={20} />} rightIcon={pencil} onPress={openWeekdaySelection} groupPosition="middle" />
			<SettingsListTimeInput title={translate(TranslationKeys.startTime)} value={event.start} initialValue={timeToMinutes(event.start) * 60} hoursEnabled minutesEnabled saveLabel={translate(TranslationKeys.save)} leftIcon={<MaterialCommunityIcons name="clock-start" size={20} />} onSave={seconds => saveTime('start', seconds)} groupPosition="middle" />
			<SettingsListTimeInput title={translate(TranslationKeys.endTime)} value={event.end} initialValue={timeToMinutes(event.end) * 60} hoursEnabled minutesEnabled saveLabel={translate(TranslationKeys.save)} leftIcon={<MaterialCommunityIcons name="clock-end" size={20} />} onSave={seconds => saveTime('end', seconds)} groupPosition="bottom" showSeparator={false} />

			<SettingsListGroupTitle title={translate(TranslationKeys.color)} />
			<View style={styles.swatches}>
				{swatches.map(color => {
					const selected = color.toLowerCase() === event.color.toLowerCase();
					return (
						<TouchableOpacity key={color} onPress={() => update({ color })} style={[styles.swatch, { backgroundColor: color }, selected && { borderColor: theme.screen.text, borderWidth: 3 }]} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${translate(TranslationKeys.color)} ${color}`}>
							{selected ? <MaterialCommunityIcons name="check" size={20} color={myContrastColor(color, theme, isDark)} /> : null}
						</TouchableOpacity>
					);
				})}
				<TouchableOpacity onPress={openColorSelection} style={[styles.swatch, { backgroundColor: theme.screen.iconBg }]} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.course_timetable_more_colors)}>
					<MaterialCommunityIcons name="pencil" size={20} color={theme.screen.icon} />
				</TouchableOpacity>
			</View>

			{isNew ? (
				<ProjectButton text={translate(TranslationKeys.save)} onPress={saveNewEvent} iconLeft={<MaterialCommunityIcons name="content-save" size={20} color={myContrastColor(accentColor, theme, isDark)} />} />
			) : (
				<TouchableOpacity onPress={confirmDelete} style={[styles.deleteButton, { borderColor: theme.sheet.inputBorderInvalid }]} accessibilityRole="button">
					<MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.sheet.inputBorderInvalid} />
					<Text style={[styles.deleteText, { color: theme.sheet.inputBorderInvalid }]}>{translate(TranslationKeys.course_timetable_delete_event)}</Text>
				</TouchableOpacity>
			)}

			{/* Debug mode only: the stored event, including what the import source sent (source_data). */}
			<DebugView title="Debug: JSON" logs={[JSON.stringify(event, null, 2)]} />
		</View>
	);
};

export default CourseEventDetailsSheet;

/** A fresh draft for the "+ event" button, on the given weekday. */
export function createCourseEventDraft(weekday: CourseTimetableWeekday): CourseTimetableEvent {
	return {
		id: NEW_COURSE_EVENT_ID,
		title: '',
		location: '',
		kind: '',
		color: COURSE_COLOR_SWATCHES[0] ?? '#3A78D8',
		start: '10:15',
		end: '11:45',
		weekday,
		source: 'manual',
	};
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		paddingBottom: 24,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		paddingVertical: 8,
		marginBottom: 12,
	},
	headerIcon: {
		width: 52,
		height: 52,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerText: {
		flex: 1,
		gap: 2,
	},
	title: {
		fontSize: 22,
		fontFamily: 'Poppins_700Bold',
	},
	subtitle: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
	},
	hint: {
		flexDirection: 'row',
		gap: 10,
		padding: 12,
		borderRadius: 14,
		marginBottom: 14,
	},
	hintText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 19,
		fontFamily: 'Poppins_400Regular',
	},
	locationActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	inlineEdit: {
		padding: 8,
	},
	swatches: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		paddingHorizontal: 4,
		marginBottom: 8,
	},
	swatch: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 48,
		borderRadius: 12,
		borderWidth: 1.5,
		marginTop: 24,
	},
	deleteText: {
		fontSize: 15,
		fontFamily: 'Poppins_600SemiBold',
	},
	confirm: {
		gap: 12,
	},
	confirmText: {
		fontSize: 15,
		fontFamily: 'Poppins_400Regular',
	},
	confirmButton: {
		marginVertical: 0,
	},
	cancel: {
		alignSelf: 'center',
		paddingVertical: 8,
	},
});
