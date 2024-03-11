import React, {FunctionComponent} from 'react';
import {Icon, MyActionsheet} from '../../../../kitcheningredients';
import {AppTranslation, useAppTranslation} from '../../translations/AppTranslation';
import {useCourseTimetableEvents} from '../CourseTimetableHelper';
import {SettingsRow} from '../../settings/SettingsRow';

export const SettingCourseTimetableReset: FunctionComponent = (props) => {
	const [timetableEvents, setTimetableEvents] = useCourseTimetableEvents()

	const actionsheet = MyActionsheet.useActionsheet();

	const translationReset = useAppTranslation('reset');
	const translationScreenName = useAppTranslation('screenNameCourseTimetable');
	const rowTitle = translationReset+': '+translationScreenName;

	function onReset() {
		setTimetableEvents({});
	}

	function showConfirmDialog() {
		actionsheet.show({
			title: rowTitle,
			acceptLabel: translationReset,
			cancelLabel: <AppTranslation id={'cancel'} />,
			onAccept: () => {
				onReset()
			}
		})
	}

	return (
		<SettingsRow leftContent={rowTitle}
			leftIcon={<Icon name={'trash-can'} />}
			onPress={() => {
				showConfirmDialog()
			}}
		/>
	)
}
