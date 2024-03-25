import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {NoCourseTimetableFound} from '@/compositions/courseTimetable/NoCourseTimetableFound';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useIsDemo} from '@/states/SynchedDemo';
import {Text, View, useViewBackgroundColor} from '@/components/Themed';
import {MyButton} from '@/components/buttons/MyButton';
import {DateHelper} from '@/helper/date/DateHelper';
import {useBreakPointValue} from '@/helper/device/DeviceHelper';
import {useSynchedFirstWeekday} from '@/states/SynchedFirstWeekday';
import {useProfileLocaleForJsDate} from '@/states/SynchedProfile';
import {
	BaseCourseTimetableEvent,
	CourseTimetableDictType, CourseTimetableEventType,
	useCourseTimetableEvents, usePersonalCourseTimetableAmountDaysOnScreen,
	usePersonalCourseTimetableTimeEnd, usePersonalCourseTimetableTimeStart
} from '@/compositions/courseTimetable/CourseTimetableHelper';
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from '@/components/actionsheet/MyGlobalActionSheet';
import React from 'react';
import {TimetableImportDemo} from '@/compositions/courseTimetable/timetableProviders/TimetableImportDemo';
import {CourseTimetableSchedule} from '@/compositions/courseTimetable/CourseTimetableSchedule';
import {SettingsRowActionsheet} from '@/components/settings/SettingsRowActionsheet';
import {IconNames} from '@/constants/IconNames';
import {CourseTimetableEvent} from '@/compositions/courseTimetable/CourseTimetableEvent';
import {useIsDebug} from "@/states/Debug";
import {MarkingList} from "@/components/food/MarkingList";

export default function EatingHabitsScreen() {


	return (
		<MySafeAreaView>
			<MarkingList />
		</MySafeAreaView>
	)
}
