import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useIsCurrentUserAnonymous} from '@/states/User';
import {router} from "expo-router";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {IconNames} from "@/constants/IconNames";


export const useNavigateToDeleteUser = () => {
	const onPress = () => {
		router.push('/(app)/settings/delete-user/');
	}

	return onPress
}

export const useTranslationAccountDelete = () => {
	const translation_account = useTranslation(TranslationKeys.account)
	const translation_delete = useTranslation(TranslationKeys.delete)
	const translation_title = translation_account + ' ' + translation_delete
	return translation_title;
}



interface AppState {

}
export const SettingsRowUserDelete: FunctionComponent<AppState> = ({...props}) => {
	const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

	const translation_title = useTranslationAccountDelete()

	const onPress = useNavigateToDeleteUser();

	const accessibilityLabel = translation_title;

	if (isCurrentUserAnonymous) {
		return null
	}

	return (
		<>
			<SettingsRow labelLeft={translation_title} onPress={onPress} accessibilityLabel={accessibilityLabel} leftIcon={IconNames.user_account_delete_icon} {...props}  />
		</>
	)
}
