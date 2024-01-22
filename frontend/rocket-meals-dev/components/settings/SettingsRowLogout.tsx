import React from "react";
import {isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";


export const SettingsRowLogout = (props) => {
    const loggedIn = isUserLoggedIn();
    const [currentUser, setCurrentUser] = useCurrentUser()
    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)


    const onPress = () => {
        setAuthData(null)
        setCurrentUser(null)
    }

    return(
        <SettingsRow accessibilityLabel={"Logout"} onPress={onPress} leftIcon={"account"} leftContent={"Logout"} rightIcon={"logout"} />
    )
}
