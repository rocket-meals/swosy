import React, {FunctionComponent} from 'react';
import {useIsDebug} from '@/states/Debug';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {Text, View} from '@/components/Themed';
import {useCurrentUser, useIsCurrentUserAnonymous} from '@/states/User';
import {IconNames} from '@/constants/IconNames';

interface AppState {

}
export const SettingsRowUser: FunctionComponent<AppState> = ({...props}) => {
	const [currentUser, setUserWithCache] = useCurrentUser();
	const isCurrentUserAnonymous = useIsCurrentUserAnonymous();
	const debug = useIsDebug();

	const leftIcon = IconNames.settings_user_account_icon
	const translation_title = useTranslation(TranslationKeys.account)
	const translation_anonymous = useTranslation(TranslationKeys.anonymous)
	const label = translation_title
	let labelRight = currentUser?.id
	if (isCurrentUserAnonymous) {
		labelRight = translation_anonymous
	}

	const accessibilityLabel = translation_title;

	return (
		<>
			<SettingsRow labelLeft={label} accessibilityLabel={accessibilityLabel} labelRight={labelRight} leftIcon={leftIcon} {...props}>
			</SettingsRow>
		</>
	)
}
