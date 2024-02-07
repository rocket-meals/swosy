import React from 'react';
import {Text} from "@/components/Themed";
import {UrlHelper} from "@/helper/UrlHelper";
import {AuthProvider, ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {MyExternalLink} from '@/components/link/MyExternalLink';
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";

// Define the type for Single Sign-On (SSO) providers
type SsoProvider = {
    provider: AuthProvider
}

function isSsoLoginPossible() {
    let urlToLogin = UrlHelper.getURLToLogin();
    // check if we are in expo go on mobile
    let isExpoGoWithSsoWorking = false;
    if(urlToLogin.startsWith("exp://")) { // app is running in expo go
        if(urlToLogin.startsWith("exp://u.expo.dev")) {
            isExpoGoWithSsoWorking = true; // this is when the update is uploaded to expo for example via expo publish or our workflow
        } else {
            isExpoGoWithSsoWorking = false; // url is like: exp://192.168.178.35:8081 or something like that
        }

        return isExpoGoWithSsoWorking
    }

    return true;
}

// The component to handle SSO login links
export const ButtonAuthProvider = ( {provider}: SsoProvider) => {
    const isDebug = useIsDebug();

    const translation_log_in_with = useTranslation(TranslationKeys.sign_in_with);

    let providerName = provider.name;
    // capitalize first letter
    providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);

    let accessibilityLabel = translation_log_in_with+": "+providerName;
    let text = translation_log_in_with+": "+providerName;

    const url = ServerAPI.getUrlToProviderLogin(provider);

    const disabled = !isSsoLoginPossible();

    if(disabled) {
        text += "\n"
        text += "Does not work on local ExpoGo"
    }

    if(isDebug) {
        text += "\n"
        text += "Debug: URL: "+url
    }

    let onPress = () => {
        CommonSystemActionHelper.openExternalURL(url)
    }

    return (
        // @ts-ignore
        <ButtonAuthProviderCustom key={"ssoButton"+provider.name} disabled={disabled} accessibilityLabel={accessibilityLabel} onPress={onPress} icon_name={provider.name} text={text} />
    );
};
