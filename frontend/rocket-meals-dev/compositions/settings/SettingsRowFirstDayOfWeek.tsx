import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {useSynchedFirstWeekday} from '@/states/SynchedFirstWeekday';
import {AvailableOption, SettingsRowSelectDayOfWeek} from '@/compositions/settings/SettingsRowSelectDayOfWeek';
import {Weekday} from '@/helper/date/DateHelper';

interface AppState {

}
export const SettingsRowFirstDayOfWeek: FunctionComponent<AppState> = ({...props}) => {
	const title = useTranslation(TranslationKeys.first_day_of_week)

	const translation_first_day_of_week_system = useTranslation(TranslationKeys.first_day_of_week_system)

	const [firstDayOfWeek, setFirstDayOfWeekRaw, firstDayOfWeekRaw] = useSynchedFirstWeekday();

	const additionalOptionSystem: AvailableOption = {
		value: null,
		name: translation_first_day_of_week_system,
		icon: undefined
	}

	const additionalOptions = {
		'system': additionalOptionSystem
	}

	async function onSelect(option: AvailableOption, hide: () => void) {
		let value = null;
		if (option.value) {
			value = option.value as Weekday;
		}
		setFirstDayOfWeekRaw(value);
		hide()
	}

	return <SettingsRowSelectDayOfWeek icon={IconNames.first_weekday_icon} title={title} onSelect={onSelect} selectedValue={firstDayOfWeek} additionalOptions={additionalOptions} />
}
