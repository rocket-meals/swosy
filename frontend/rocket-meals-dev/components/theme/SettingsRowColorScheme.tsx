import React, {FunctionComponent} from "react";
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {
    getMyColorSchemeKeyOptions, MyColorSchemeKey, useColorSchemeKeyToThemeDictionary, useMyColorSchemeKeyDetermined,
    useMyColorSchemeKeySavedOption, useThemeDetermined
} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {Text} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

interface AppState {

}
export const SettingsRowColorScheme: FunctionComponent<AppState> = ({...props}) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const title = useTranslation(TranslationKeys.color_scheme)

    let availableColorSchemeKeys = getMyColorSchemeKeyOptions()
    let [savedColorSchemeOptionRaw, setColorSchemeOptionRaw] = useMyColorSchemeKeySavedOption()
    const selectedColorSchemeKey = useMyColorSchemeKeyDetermined()
    const theme = useThemeDetermined()
    const isDebug = useIsDebug()

    const colorSchemeKeyToThemeDict = useColorSchemeKeyToThemeDictionary()

    const color_scheme_light = useTranslation(TranslationKeys.color_scheme_light)
    const color_scheme_dark = useTranslation(TranslationKeys.color_scheme_dark)
    const color_scheme_system = useTranslation(TranslationKeys.color_scheme_system)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const colorSchemeKeyToName = {
        [MyColorSchemeKey.Light]: color_scheme_light,
        [MyColorSchemeKey.Dark]: color_scheme_dark,
        [MyColorSchemeKey.System]: color_scheme_system
    }

    let selectedThemeName = colorSchemeKeyToName[selectedColorSchemeKey]

    const accessibilityLabel = translation_edit+": "+title + " " + selectedThemeName
    const label = title

    let items = []
    for(let key of availableColorSchemeKeys){
        let label = colorSchemeKeyToName[key]
        let themeForKey = colorSchemeKeyToThemeDict[key]
        let isDark = themeForKey.dark

        items.push({
            key: key,
            label: label,
            icon: isDark ? "moon-waning-crescent" : "white-balance-sunny",
            onSelect: async (key) => {
                setColorSchemeOptionRaw(key)
                return true // do not close the actionsheet
            }
        })
    }

    const config = {
        onCancel: undefined,
        visible: true,
        title: title,
        items: items
    }

    function renderDebug(){
        if(isDebug){
            return(
                <>
                    <Text>{"selectedThemeName: "+selectedThemeName}</Text>
                    <Text>{JSON.stringify(theme, null, 2)}</Text>
                </>
            )
        }
    }

    const colorSchemeIconName = "theme-light-dark"

    return(
        <>
            <SettingsRowActionsheet config={config} accessibilityLabel={accessibilityLabel} leftContent={label} rightContent={selectedThemeName} leftIcon={colorSchemeIconName} {...props}  />
            {renderDebug()}
        </>
    )
}
