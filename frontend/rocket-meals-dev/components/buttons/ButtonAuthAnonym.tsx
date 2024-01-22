import React, {useEffect, useState} from 'react';
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {getAnonymousUser, getIsUserAnonymous, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {router} from "expo-router";

// The component to handle SSO login links
export const ButtonAuthAnonym = () => {
    const [currentUser, setCurrentUser] = useCurrentUser()
    const [loginInitiated, setLoginInitiated] = useState(false)

    const continueAnonym = useTranslation(TranslationKeys.continue_as_anonymous)
    const isAnonymoutUser = getIsUserAnonymous(currentUser)

    useEffect(() => {
        if(loginInitiated && isAnonymoutUser){ // if the login is initiated and the user is anonymous set
            setLoginInitiated(false) // we set the login initiated to false so we dont get into an infinite loop
            router.navigate('/(app)/home'); // we navigate to the home screen
        }
    }, [currentUser, loginInitiated]); // whenever the currentUser or loginInitiated changes we check if we need to navigate to the home screen

    const onPress = () => {
        setCurrentUser(getAnonymousUser()) // we set the user to anonymous but we cant wait for the result
        setLoginInitiated(true) // we set the login initiated to true so we can wait for the result
    }

    return (
        <ButtonAuthProviderCustom key={"authAnonym"} accessibilityLabel={continueAnonym} onPress={onPress} icon_name={"incognito"} text={continueAnonym} />
    );
};
