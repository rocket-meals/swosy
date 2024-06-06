import React, {FunctionComponent} from 'react';
import {useIsDebug} from '@/states/Debug';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useNickname} from '@/states/SynchedProfile';
import {SettingsRowTextEdit} from '@/components/settings/SettingsRowTextEdit';
import {IconNames} from '@/constants/IconNames';
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSynchedPopupEventsReadDict} from "@/states/SynchedPopupEvents";

interface AppState {

}
export const SettingsRowResetPopupEventsRead: FunctionComponent<AppState> = ({...props}) => {
	const [popupEventsReadDict, setPopupEventsReadDict] = useSynchedPopupEventsReadDict()

	async function onPress() {
		setPopupEventsReadDict((currentValue) => {
			return null
		});
	}

	const leftIcon = IconNames.news_icon
	const translation_reset = useTranslation(TranslationKeys.reset)

	const accessibilityLabel = translation_reset;

	return (
		<>
			<SettingsRow onPress={onPress} labelLeft={"Gelesene Popup Events"} accessibilityLabel={accessibilityLabel} labelRight={translation_reset} leftIcon={leftIcon} rightIcon={IconNames.delete_icon} {...props} />
		</>
	)
}
