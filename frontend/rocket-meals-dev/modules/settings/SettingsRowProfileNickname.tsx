import React, {FunctionComponent} from "react";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSynchedProfile} from "@/helper/sync_state_helper/custom_sync_states/SynchedProfile";
import {Text, View} from "@/components/Themed";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";

interface AppState {

}
export const SettingsRowProfileNickname: FunctionComponent<AppState> = ({...props}) => {

    const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
    const debug = useIsDebug();

    async function onSave(nextValue: string){
        console.log("SettingsRowProfileNickname onSave", nextValue)
        return await setProfile({...profile, nickname: nextValue})
    }

    const leftIcon = "account"
    const translation_title = useTranslation(TranslationKeys.nickname)
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
            <SettingsRowTextEdit onSave={onSave} label={label} accessibilityLabel={accessibilityLabel} labelRight={labelRight} leftIcon={leftIcon} {...props}>
            </SettingsRowTextEdit>
            {renderDebug()}
        </>
    )
}
