import React, {FunctionComponent} from "react";
import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {CourseTimetableDictType} from "@/compositions/courseTimetable/CourseTimetableHelper";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

interface AppState {
}
export const SettingCourseTimetableResetSettings: FunctionComponent<AppState> = (props) => {

	const [courseTimetableRaw, setCourseTimetableRaw] = useSyncState<CourseTimetableDictType>(PersistentStore.course_timetable)

	const actionsheet = MyActionsheet.useActionsheet();

	const translationReset = useTranslation(TranslationKeys.reset);
	const translationScreenName = useTranslation(TranslationKeys.settings);
	const rowTitle = translationReset+": "+translationScreenName;

	function onReset(){
		setTimetableSettings({});
	}

	function showConfirmDialog(){
		actionsheet.show({
			title: rowTitle,
			acceptLabel: translationReset,
			cancelLabel: <AppTranslation id={"cancel"} />,
			onAccept: () => {
				onReset()
			}
		})
	}

	return(
		<SettingsRow leftContent={rowTitle} leftIcon={<Icon name={"trash-can"} />} onPress={() => {
			showConfirmDialog()
		}} />
	)
}
