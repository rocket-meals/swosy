import React from "react";
import {isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {Text} from "@/components/Themed";


export const SettingsRowLogout = (props: any) => {
    const loggedIn = isUserLoggedIn();
    const [currentUser, setCurrentUser] = useCurrentUser()
    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)
    const isUseDebug = useIsDebug()
    const [clicked, setClicked] = React.useState(0)


    const onPress = () => {
        setAuthData(null)
        setCurrentUser(null)
        setClicked(clicked+1)
    }

    function renderDebug(){
        if(!isUseDebug){
            return null
        } else {
            return null;
        }
    }

    return(
        <>
            <SettingsRow accessibilityLabel={"Logout"} onPress={onPress} leftIcon={"account"} leftContent={"Logout"} rightIcon={"logout"} >
            </SettingsRow>
            {renderDebug()}
        </>
    )
}
