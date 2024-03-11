import React, { FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Text, View} from '@/components/Themed';
import { useIsCurrentUserAnonymous, useLogoutCallback} from '@/states/User';
import {IconNames} from '@/constants/IconNames';
import {MyGlobalActionSheetConfig} from '@/components/actionsheet/MyGlobalActionSheet';
import {MyButton} from '@/components/buttons/MyButton';
import {SettingsRowActionsheet} from '@/components/settings/SettingsRowActionsheet';
import {ServerAPI} from '@/helper/database/server/ServerAPI';
import {deleteProfileRemote, useSynchedProfile} from '@/states/SynchedProfile';

interface MyContentConfirmProps {
    text: string
    onConfirm: (hide: () => void) => void,
    hide: () => void,
}
const MyContentConfirm: FunctionComponent<MyContentConfirmProps> = (props) => {
	const translation_cancel = useTranslation(TranslationKeys.cancel)
	const translation_confirm = useTranslation(TranslationKeys.confirm)

	return (
		<View style={{
			width: '100%',
			marginTop: 10,
		}}
		>
			<View style={{
				width: '100%',
				justifyContent: 'center',
				alignItems: 'center',
			}}
			>
				<Text>
					{props.text}
				</Text>
			</View>
			<View style={{
				width: '100%', flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end', marginBottom: 10
			}}
			>
				<MyButton useOnlyNecessarySpace={true}
					isActive={false}
					accessibilityLabel={translation_cancel}
					text={translation_cancel}
					onPress={async () => {
						props?.hide()
					}}
					leftIcon={IconNames.cancel_icon}
				/>
				<View style={{
					// small space between the buttons
					width: 10,
				}}
				/>
				<MyButton useOnlyNecessarySpace={true}
					accessibilityLabel={translation_confirm}
					text={translation_confirm}
					onPress={() => {
						props.onConfirm(props.hide)
					}}
					isActive={true}
					leftIcon={IconNames.confirm_icon}
				/>
			</View>
		</View>
	)
}


interface AppState {

}
export const SettingsRowUserDelete: FunctionComponent<AppState> = ({...props}) => {
	const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

	const logout = useLogoutCallback()

	const [profile, setProfile] = useSynchedProfile()

	const leftIcon = IconNames.user_account_delete_icon
	const translation_account = useTranslation(TranslationKeys.account)
	const translation_delete = useTranslation(TranslationKeys.delete)
	const translation_are_you_sure_to_delete_your_account = useTranslation(TranslationKeys.are_you_sure_to_delete_your_account)
	const translation_title = translation_account + ' ' + translation_delete
	const labelLeft = translation_title
	const title = translation_title

	const accessibilityLabel = translation_title;

	if (isCurrentUserAnonymous) {
		return null
	}

	async function handleDelete(hide: () => void) {
		try {
			// Delete Profile fist, in order to make sure every Foreign Key Constraint is removed
			if (profile?.id) {
				await deleteProfileRemote(profile.id);
			}
			const result = ServerAPI.deleteMe();
			logout();
		} catch (err) {
			/**
             {
             "errors": [
             {
             "message": "delete from `directus_users` where `id` in ('dc7ef60c-ffda-4076-9ccb-aa7dee5e937b') - SQLITE_CONSTRAINT: FOREIGN KEY constraint failed",
             "extensions": {
             "code": "INTERNAL_SERVER_ERROR"
             }
             }
             ],
             "response": {}
             }
             */
			console.log('Error deleting user');
			console.log(err);
		}
	}

	const config: MyGlobalActionSheetConfig = {
		visible: true,
		title: title,
		renderCustomContent: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
			// Use the custom context provider to provide the input value and setter
			return <MyContentConfirm hide={hide}  onConfirm={handleDelete} text={translation_are_you_sure_to_delete_your_account}/>
		}

	}

	return (
		<>
			<SettingsRowActionsheet leftIcon={IconNames.user_account_delete_icon} labelLeft={labelLeft} config={config} accessibilityLabel={accessibilityLabel} {...props}  />
		</>
	)
}
