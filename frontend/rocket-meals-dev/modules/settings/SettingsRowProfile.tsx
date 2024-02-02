import React, {FunctionComponent} from "react";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSynchedProfile} from "@/helper/sync_state_helper/custom_sync_states/SynchedProfile";
import {Text, View} from "@/components/Themed";

interface AppState {

}
export const SettingsRowProfile: FunctionComponent<AppState> = ({...props}) => {

    const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
    const debug = useIsDebug();

    const leftIcon = "account"
    const translation_title = useTranslation(TranslationKeys.profile)
    const label = translation_title
    const labelRight = profile?.nickname

    const accessibilityLabel = translation_title;

    function renderDebug(){
        if(debug){
            return <View style={{width: "100%"}}>
                <Text>{JSON.stringify(profile, null, 2)}</Text>
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
