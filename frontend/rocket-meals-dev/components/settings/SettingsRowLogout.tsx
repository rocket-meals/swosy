import React from "react";
import {isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {Text} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";


export const SettingsRowLogout = (props: any) => {
    // TODO: Implement logout functionality at ServerAPI
    const [currentUser, setCurrentUser] = useCurrentUser()
    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

    const translation_title = useTranslation(TranslationKeys.logout)

    const onPress = () => {
        setAuthData(null)
        setCurrentUser(null)
    }

    return(
        <>
            <SettingsRow accessibilityLabel={translation_title} onPress={onPress} leftIcon={"account"} leftContent={translation_title} rightIcon={"logout"} >
            </SettingsRow>
        </>
    )
}
