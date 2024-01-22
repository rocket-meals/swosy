import React from 'react';
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

// The component to handle SSO login links
export const ButtonAuthDebug = () => {
    const isDebug = useIsDebug();
    const translation_log_in_with = useTranslation(TranslationKeys.log_in_with);
    const [debugAutoLogin, setDebugAutoLogin] = useSyncState<boolean>(PersistentStore.debugAutoLogin)

    if(!isDebug) {
        //return null;
    }

    let accessibilityLabel = translation_log_in_with+": "+"Debug";
    let text = translation_log_in_with+": "+"Debug";


    const onPress = () => {
        setDebugAutoLogin(true)
    }

    return (
        <ButtonAuthProviderCustom accessibilityLabel={accessibilityLabel} onPress={onPress} icon_name={"bug"} text={text}>
        </ButtonAuthProviderCustom>
    );
};
