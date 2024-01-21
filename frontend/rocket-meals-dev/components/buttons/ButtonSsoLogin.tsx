import React, { useState, useEffect } from 'react';
import { StyleSheet} from 'react-native';
import {Text, View} from "@/components/Themed";
import {UrlHelper} from "@/helper/UrlHelper";
import {ExternalLink} from "@/components/ExternalLink";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {ViewWithPercentageSupport} from "@/components/ViewWithPercentageSupport";
import {useProjectColor, useProjectColorContrast} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {MyButton} from "@/components/buttons/MyButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

// Define the type for Single Sign-On (SSO) providers
type SsoProvider = {
    provider: string,
    display_name: string,
    icon: string,
}

function isSsoLoginPossible(urlToLogin: string) {
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
const ButtonSsoLogin = ({ provider, display_name }: SsoProvider) => {
    const projectColorContrast = useProjectColorContrast();
    const isDebug = useIsDebug();

    const translation_log_in_with = useTranslation(TranslationKeys.log_in_with);
    let accessibilityLabel = translation_log_in_with+": "+display_name;

    const url = ServerAPI.getUrlToProviderLogin(provider);
    let urlToLogin = UrlHelper.getURLToLogin();

    const ssoLoginPossible = isSsoLoginPossible(urlToLogin);

    let contentRows = [];

    contentRows.push(
        <Text key={"loginWithText"} >{"Login with: "+display_name+"\n"}</Text>
    )

    if(!ssoLoginPossible) {
        contentRows.push(
            <Text key={"loginNotPossible"}>{"Does not work on local ExpoGo"}</Text>
        )
    }

    if(isDebug) {
        contentRows.push(
            <Text key={"loginWithDebugText"} >{"URL: "+url}</Text>
        )
    }

    let buttonStyled = (
        <MyButton accessibilityLabel={accessibilityLabel} leftIconName={"google"} leftIconColor={projectColorContrast}>
            {contentRows}
        </MyButton>
    )

    return (
        <ExternalLink disabled={!ssoLoginPossible} target={"_self"} href={url} style={styles.link}>
            {buttonStyled}
        </ExternalLink>
    );
};

const styles = StyleSheet.create({
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
});

export default ButtonSsoLogin;
