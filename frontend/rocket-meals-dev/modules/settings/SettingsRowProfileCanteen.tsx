import React, {FunctionComponent} from "react";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {
    useSynchedProfile,
    useSynchedProfileCanteen
} from "@/helper/sync_state_helper/custom_sync_states/SynchedProfile";
import {Text, View} from "@/components/Themed";

interface AppState {

}
export const SettingsRowProfileCanteen: FunctionComponent<AppState> = ({...props}) => {

    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const leftIcon = "warehouse"
    const translation_title = useTranslation(TranslationKeys.canteen)
    const label = translation_title
    const canteenId = profileCanteen?.id;
    const canteenIdAsString = canteenId ? canteenId+"" : undefined;
    const labelRight: string = profileCanteen?.label || canteenIdAsString || "unknown";

    const accessibilityLabel = translation_title;

    return(
        <>
            <SettingsRow label={label} accessibilityLabel={accessibilityLabel} labelRight={labelRight} leftIcon={leftIcon} {...props}>
            </SettingsRow>
        </>
    )
}
