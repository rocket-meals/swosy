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
        if(loginInitiated && isAnonymoutUser){
            setLoginInitiated(false)
            router.navigate('/(app)/home');
        }
    }, [currentUser, loginInitiated]);

    const onPress = () => {
        setCurrentUser(getAnonymousUser())
        setLoginInitiated(true)
    }

    return (
        <ButtonAuthProviderCustom accessibilityLabel={continueAnonym} onPress={onPress} icon_name={"incognito"} text={continueAnonym}>
        </ButtonAuthProviderCustom>
    );
};
