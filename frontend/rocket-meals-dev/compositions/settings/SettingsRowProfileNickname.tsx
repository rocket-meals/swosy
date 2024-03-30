import React, {FunctionComponent} from 'react';
import {useIsDebug} from '@/states/Debug';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useNickname, useSynchedProfile} from '@/states/SynchedProfile';
import {Text, View} from '@/components/Themed';
import {SettingsRowTextEdit} from '@/components/settings/SettingsRowTextEdit';
import {IconNames} from '@/constants/IconNames';

interface AppState {

}
export const SettingsRowProfileNickname: FunctionComponent<AppState> = ({...props}) => {
	const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
	const [nickname, setNickname] = useNickname()
	const debug = useIsDebug();

	async function onSave(nextValue: string | null | undefined) {
		console.log('SettingsRowProfileNickname onSave', nextValue)
		return await setNickname(nextValue)
	}

	const leftIcon = IconNames.profile_nickname_icon
	const translation_title = useTranslation(TranslationKeys.nickname)
	const label = translation_title
	const labelRight = nickname

	const accessibilityLabel = translation_title;

	return (
		<>
			<SettingsRowTextEdit onSave={onSave} labelLeft={label} accessibilityLabel={accessibilityLabel} labelRight={labelRight} leftIcon={leftIcon} {...props} />
		</>
	)
}
