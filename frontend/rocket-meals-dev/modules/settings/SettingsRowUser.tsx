import React, {FunctionComponent} from "react";
import {useIsDebug} from "@/states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {Text, View} from "@/components/Themed";
import {useCurrentUser} from "@/states/User";

interface AppState {

}
export const SettingsRowUser: FunctionComponent<AppState> = ({...props}) => {

    let [currentUser, setUserWithCache] = useCurrentUser();
    const debug = useIsDebug();

    const leftIcon = "badge-account-horizontal"
    const translation_title = useTranslation(TranslationKeys.user)
    const label = translation_title
    const labelRight = currentUser?.first_name || currentUser?.id

    const accessibilityLabel = translation_title;

    function renderDebug(){
        if(debug){
            return <View style={{width: "100%"}}>
                <Text>{JSON.stringify(currentUser, null, 2)}</Text>
            </View>
        }
    }

    return(
        <>
            <SettingsRow label={label} accessibilityLabel={accessibilityLabel} labelRight={labelRight} leftIcon={leftIcon} {...props}>
            </SettingsRow>
            {renderDebug()}
        </>
    )
}
