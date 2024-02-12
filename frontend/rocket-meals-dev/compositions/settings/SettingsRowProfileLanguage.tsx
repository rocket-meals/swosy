import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {useIsDebug} from "@/states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {
    DrawerConfigPosition,
    getDrawerPositionKeyOptions,
    useDrawerPositionRaw
} from "@/states/DrawerSyncConfig";
import {useProfileLanguage} from "@/states/SynchedProfile";
import {useSynchedLanguagesDict} from "@/states/SynchedLanguages";
import {
    useGlobalActionSheetSettingProfileLanguage
} from "@/compositions/settings/UseGlobalActionSheetSettingProfileLanguage";
import {SettingsRow} from "@/components/settings/SettingsRow";

interface AppState {

}
export const SettingsRowProfileLanguage: FunctionComponent<AppState> = ({...props}) => {

    const colorSchemeIconName = "translate"

    const translation_edit = useTranslation(TranslationKeys.edit)

    const title = useTranslation(TranslationKeys.language)

    const [selectedLanguageKey, setSavedLanguageKey] = useProfileLanguage()
    const [languageDict, setLanguageDict] = useSynchedLanguagesDict();
    const usedLanguageDict = languageDict || {}

    let selectedName: string = selectedLanguageKey
    let selectedLanguage = usedLanguageDict[selectedLanguageKey]
    if(selectedLanguage){
        selectedName = selectedLanguage.name || selectedLanguage.code
    }

    const accessibilityLabel = translation_edit+": "+title + " " + selectedName
    const label = title

    const onPress = useGlobalActionSheetSettingProfileLanguage();

    return(
        <>
            <SettingsRow accessibilityLabel={accessibilityLabel} labelRight={selectedName} labelLeft={label} leftIcon={colorSchemeIconName} {...props} onPress={onPress} />
        </>
    )
}
