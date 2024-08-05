import {MySafeAreaView} from '@/components/MySafeAreaView';
import React from 'react';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Text, View} from "@/components/Themed";
import {IconNames} from "@/constants/IconNames";
import {useTranslationAccountDelete} from "@/compositions/settings/SettingsRowUserDelete";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {deleteProfileRemote, useSynchedProfile} from "@/states/SynchedProfile";
import {ServerAPI} from "@/helper/database/server/ServerAPI";
import {useLogoutCallback} from '@/states/User';
import {AnimationAstronautComputer} from "@/compositions/animations/AnimationAstronautComputer";
import {useMyModalConfirmer} from "@/components/modal/MyModalConfirmer";
import {SettingsRow} from "@/components/settings/SettingsRow";


export default function DeleteAccountScreen() {

	const translation_title = useTranslationAccountDelete();

	const translation_delete = useTranslation(TranslationKeys.delete)
	const translation_are_you_sure_to_delete_your_account = useTranslation(TranslationKeys.are_you_sure_to_delete_your_account)

	const logout = useLogoutCallback()

	const [profile, setProfile] = useSynchedProfile()

	function renderAnonymousAttention() {
		return(
			<View style={{width: "100%"}}>
				<AnimationAstronautComputer />
				<View style={{
					width: "100%",
					paddingHorizontal: 20,
				}}>
					<View style={{
						width: "100%",
						paddingBottom: 20,
					}}>
						<Text>{translation_are_you_sure_to_delete_your_account}</Text>
					</View>
				</View>
			</View>
		)
	}

	async function handleDelete() {
		try {
			// Delete Profile fist, in order to make sure every Foreign Key Constraint is removed
			if (profile?.id) {
				await deleteProfileRemote(profile.id);
			}
			const result = ServerAPI.deleteMe();
			logout();
			return true;
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
			return false;
		}
	}

	const askForConfirmation = useMyModalConfirmer({
		onConfirm: handleDelete,
		confirmLabel: translation_delete,
		renderAsContentPreItems: (key: string, hide: () => void) => {
			return renderAnonymousAttention();
		}
	})


	return (
		<MySafeAreaView>
			<MyScrollView>
				<AnimationAstronautComputer />
				<SettingsRow onPress={askForConfirmation} leftIcon={IconNames.user_account_delete_icon} labelLeft={translation_title} accessibilityLabel={translation_title}  />
			</MyScrollView>
		</MySafeAreaView>
	)
}
