import React, {FunctionComponent} from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {
    useGlobalActionSheetSettingProfileCanteen
} from "@/compositions/settings/UseGlobalActionSheetSettingProfileCanteen";
import {IconNames} from "@/constants/IconNames";

interface AppState {

}

export function useEditProfileCanteenAccessibilityLabel(): string {
    const translation_title = useTranslation(TranslationKeys.canteen)
    const translation_edit = useTranslation(TranslationKeys.edit)
    return translation_title + " " + translation_edit;
}

export const SettingsRowProfileCanteen: FunctionComponent<AppState> = ({...props}) => {

    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const leftIcon = IconNames.canteen_icon
    const translation_title = useTranslation(TranslationKeys.canteen)
    const label = translation_title
    const canteenId = profileCanteen?.id;
    const canteenIdAsString = canteenId ? canteenId+"" : undefined;
    const labelRight: string = profileCanteen?.label || canteenIdAsString || "unknown";

    const accessibilityLabel = useEditProfileCanteenAccessibilityLabel();

    const onPress = useGlobalActionSheetSettingProfileCanteen();

    return(
        <>
            <SettingsRow accessibilityLabel={accessibilityLabel} labelRight={labelRight} labelLeft={label} leftIcon={leftIcon} {...props} onPress={onPress} />
        </>
    )
}
