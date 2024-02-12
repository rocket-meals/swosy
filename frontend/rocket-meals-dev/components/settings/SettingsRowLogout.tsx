import React from "react";
import {isUserLoggedIn, useCurrentUser, useLogoutCallback} from "@/states/User";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSyncState} from "@/helper/syncState/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/syncState/PersistentSecureStore";
import {useIsDebug} from "@/states/Debug";
import {Text} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";


export const SettingsRowLogout = (props: any) => {
    // TODO: Implement logout functionality at ServerAPI
    const logout = useLogoutCallback()

    const translation_title = useTranslation(TranslationKeys.logout)

    return(
        <>
            <SettingsRow labelLeft={translation_title} accessibilityLabel={translation_title} onPress={logout} leftIcon={"account"} leftContent={translation_title} rightIcon={"logout"} >
            </SettingsRow>
        </>
    )
}
