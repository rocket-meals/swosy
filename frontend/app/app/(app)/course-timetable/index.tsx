import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {NoCourseTimetableFound} from '@/compositions/courseTimetable/NoCourseTimetableFound';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useIsDemo} from '@/states/SynchedDemo';
import {Text, useViewBackgroundColor, View} from '@/components/Themed';
import {MyButton} from '@/components/buttons/MyButton';
import {DateHelper} from '@/helper/date/DateHelper';
import {useBreakPointValue} from '@/helper/device/DeviceHelper';
import {useSynchedFirstWeekday} from '@/states/SynchedFirstWeekday';
import {useProfileLocaleForJsDate} from '@/states/SynchedProfile';
import {
	BaseCourseTimetableEvent,
	CourseTimetableDictType,
	CourseTimetableEventType,
	useCourseTimetableEvents,
	usePersonalCourseTimetableAmountDaysOnScreen,
	usePersonalCourseTimetableTimeEnd,
	usePersonalCourseTimetableTimeStart
} from '@/compositions/courseTimetable/CourseTimetableHelper';
import React from 'react';
import {TimetableImportDemo} from '@/compositions/courseTimetable/timetableProviders/TimetableImportDemo';
import {CourseTimetableSchedule} from '@/compositions/courseTimetable/CourseTimetableSchedule';
import {IconNames} from '@/constants/IconNames';
import {CourseTimetableEvent} from '@/compositions/courseTimetable/CourseTimetableEvent';
import {useIsDebug} from "@/states/Debug";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";

export default function CourseTimetableScreen() {
	const translation_import = useTranslation(TranslationKeys.import);
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const isDemo = useIsDemo()
	const isDebug = useIsDebug()

	const locale = useProfileLocaleForJsDate();
	const backgroundColor = useViewBackgroundColor()

	const [firstDayOfWeek, setFirstDayOfWeek] = useSynchedFirstWeekday()
	const [startTime, setStartTime] = usePersonalCourseTimetableTimeStart();
	const [endTime, setEndTime] = usePersonalCourseTimetableTimeEnd();
	const [amountDaysOnScreen, setAmountDaysOnScreen] = usePersonalCourseTimetableAmountDaysOnScreen();
	const [timetableEvents, setTimetableEvents, addNewCourseTimetableEvent, removeCourseTimetableEvent] = useCourseTimetableEvents();

	const translation_event = useTranslation(TranslationKeys.event)
	const translation_create = useTranslation(TranslationKeys.create)
	const translation_edit = useTranslation(TranslationKeys.edit)

	const translationCreateEvent = translation_event+' '+translation_create

	const breakPointsAmountOfDaysToShowOnScreen = {
		sm: 2.1,
		md: 5.1,
		lg: 7,
		xl: 7
	}
	const amountOfDaysToShowOnScreen = amountDaysOnScreen || useBreakPointValue(breakPointsAmountOfDaysToShowOnScreen)

	function renderTimetableEventForEditOrCreate(item?: BaseCourseTimetableEvent | CourseTimetableEventType) {
		return (
			<MyScrollView>
				<CourseTimetableEvent item={item}
					handleEditExisting={async (usedEvent: CourseTimetableEventType, hide: () => void) => {
						console.log(usedEvent)
						// update the event in the timetableEvents with the id
						timetableEvents[usedEvent.id] = usedEvent;
						setTimetableEvents((usedCourseTimetable) => {
							return timetableEvents
						})
						handlePressOnEvent(usedEvent);
					}}
					handleEditTemplate={async (usedEvent: BaseCourseTimetableEvent, hide: () => void) => {
						handlePressOnEvent(usedEvent);
					}}
					handleDelete={async (itemToDelete: CourseTimetableEventType) => {
						console.log('Delete')
						console.log(itemToDelete)
						await removeCourseTimetableEvent(itemToDelete)
						setModalConfig(null)
					}}
					handleCreateNew={async (usedEvent: BaseCourseTimetableEvent) => {
						console.log('Save')
						console.log(usedEvent)
						await addNewCourseTimetableEvent(usedEvent)
						setModalConfig(null)
					}}
				/>
			</MyScrollView>
		)
	}

	function handlePressOnEvent(item: BaseCourseTimetableEvent) {
		const configShowOnPressEvent: MyModalActionSheetItem = {
			label: translation_event + ': ' + translation_edit,
			accessibilityLabel: translation_event + ': ' + translation_edit,
			key: 'edit',
			title: translation_event + ': ' + translation_edit,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return renderTimetableEventForEditOrCreate(item)
			}
		}
		setModalConfig(configShowOnPressEvent)
	}

	function handlePressCreateEvent() {
		const configShowCreateEvent: MyModalActionSheetItem = {
			label: translationCreateEvent,
			accessibilityLabel: translationCreateEvent,
			key: 'create',
			title: translation_event + ': ' + translation_create,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return renderTimetableEventForEditOrCreate(undefined)
			}
		}
		setModalConfig(configShowCreateEvent)
	}

	const importProviders: MyModalActionSheetItem[] = []

	if (isDemo || isDebug) {
		importProviders.push({
			key: 'demo',
			label: 'Demo',
			iconLeft: IconNames.demo_icon_on,
			accessibilityLabel: 'Demo',
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return(
					<MyScrollView>
						<View style={{
							width: '100%',
						}}
						>
							<Text>{'Show Import'}</Text>
							<TimetableImportDemo onCloseModal={hide} onImport={onImport}/>
						</View>
					</MyScrollView>
				)
			}
		})
	}

	const hasImportProviders = importProviders.length > 0;

	function onImport(events: CourseTimetableEventType[]) {
		console.log('On Import')
		console.log(events);

		const newEvents: CourseTimetableDictType = {};
		let currentEventId = 1;
		for (const event of events) {
			const id = event?.id || currentEventId;
			event.id = id+'';
			newEvents[id] = event;
			currentEventId++;
		}

		console.log('New Events dict')
		console.log(newEvents);
		setTimetableEvents(newEvents)
	}

	function renderImportAction() {
		const title_import = translation_import

		if (hasImportProviders) {
			return (
				<View style={{paddingBottom: 10, paddingRight: 10}}>
					<MyButton leftIconColoredBox={true}
						useOnlyNecessarySpace={true}
						leftIcon={IconNames.calendar_import_icon}
						accessibilityLabel={title_import}
						text={title_import}
						onPress={() => {
							setModalConfig({
								label: title_import,
								accessibilityLabel: title_import,
								key: 'import',
								title: title_import,
								items: importProviders
							})
						}}
					/>
				</View>
			)
		} else {
			return null;
		}
	}

	function renderActions() {
		return (
			<View style={{flexDirection: 'row', marginTop: 10, marginHorizontal: 10, flexWrap: 'wrap'}}>
				{renderImportAction()}
				<View style={{paddingBottom: 10}}>
					<MyButton leftIconColoredBox={true}
						useOnlyNecessarySpace={true}
						leftIcon={IconNames.course_timetable_create_icon}
						accessibilityLabel={translationCreateEvent}
						onPress={() => {
							handlePressCreateEvent()
						}}
						text={translationCreateEvent}
					/>
				</View>
			</View>
		)
	}

	function renderContent() {
		const coursesFound = Object.keys(timetableEvents).length > 0;
		if (!coursesFound) {
			return (
				<MyScrollView style={{
					paddingHorizontal: 10
				}}
				>
					<NoCourseTimetableFound />
				</MyScrollView>
			)
		} else {
			return (
				<View style={{width: '100%', flex: 1}}>
					<CourseTimetableSchedule
						key={amountOfDaysToShowOnScreen+'-'+firstDayOfWeek+'-'+startTime+'-'+endTime}
						weekStartsOn={firstDayOfWeek}
						currentWeekday={DateHelper.getWeekdayToday()}
						amountOfDaysToShowOnScreen={amountOfDaysToShowOnScreen}
						backgroundColor={backgroundColor}
						locale={locale}
						eventsDict={timetableEvents}
						onPressEvent={(item: CourseTimetableEventType) => {
							handlePressOnEvent(item);
						}}
						fromHour={parseInt(startTime)}
						toHour={parseInt(endTime)}
					/>
				</View>
			)
		}
	}

	return (
		<MySafeAreaViewThemed>
			{renderActions()}
			{renderContent()}
		</MySafeAreaViewThemed>
	)
}
