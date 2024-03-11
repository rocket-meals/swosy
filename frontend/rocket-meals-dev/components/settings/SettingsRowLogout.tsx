import React from 'react';
import { useLogoutCallback} from '@/states/User';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';


export const SettingsRowLogout = (props: any) => {
	// TODO: Implement logout functionality at ServerAPI
	const logout = useLogoutCallback()

	const translation_title = useTranslation(TranslationKeys.logout)

	return (
		<>
			<SettingsRow labelLeft={translation_title} accessibilityLabel={translation_title} onPress={logout} leftIcon={IconNames.logout_icon} leftContent={translation_title} rightIcon={'logout'} >
			</SettingsRow>
		</>
	)
}
