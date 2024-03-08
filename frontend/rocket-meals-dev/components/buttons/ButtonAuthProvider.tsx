import React from 'react';
import {AuthProvider, ServerAPI} from "@/helper/database/server/ServerAPI";
import {useIsDebug} from "@/states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {isInExpoGoDev} from "@/helper/device/DeviceRuntimeHelper";

// Define the type for Single Sign-On (SSO) providers
type SsoProvider = {
    provider: AuthProvider
}

function isSsoLoginPossible() {
    if(isInExpoGoDev()) { // app is running in expo go but on local ip (192....),
        // which means the redirect url would not trigger the deep link,
        // resulting in not opening the app,
        // so the SSO login does not work
        return false;
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
