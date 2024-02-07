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

    const colorSchemeIconName = "theme-light-dark"

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
    const translation_select = useTranslation(TranslationKeys.select)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const colorSchemeKeyToName: {[key in MyColorSchemeKey]: string}
        = {
        [MyColorSchemeKey.Light]: color_scheme_light,
        [MyColorSchemeKey.Dark]: color_scheme_dark,
        [MyColorSchemeKey.System]: color_scheme_system,
        [MyColorSchemeKey.DarkBlueTheme]: "Dark Blue Theme",
    }

    let selectedThemeName = colorSchemeKeyToName[selectedColorSchemeKey]

    const accessibilityLabel = translation_edit+": "+title + " " + selectedThemeName
    const label = title

    let items = []
    for(let key of availableColorSchemeKeys){
        let label: string = colorSchemeKeyToName[key]
        let themeForKey = colorSchemeKeyToThemeDict[key]
        let isDark = themeForKey.dark
        let active = key === selectedColorSchemeKey

        let icon = isDark ? "moon-waning-crescent" : "white-balance-sunny"
        if(key === MyColorSchemeKey.System){
            icon = "theme-light-dark"
        }
        if(key === MyColorSchemeKey.System && selectedColorSchemeKey === undefined){
            active = true
        }

        let itemAccessibilityLabel = label+" "+translation_select

        items.push({
            key: key as string,
            label: label,
            icon: icon,
            active: active,
            accessibilityLabel: itemAccessibilityLabel,
            onSelect: async (key: string) => {
                let nextColorSchemeKey: MyColorSchemeKey = key as MyColorSchemeKey
                setColorSchemeOptionRaw(nextColorSchemeKey)
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

    }

    let labelRight = selectedThemeName


    return(
        <>
            <SettingsRowActionsheet label={label} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={colorSchemeIconName} {...props}  />
            {renderDebug()}
        </>
    )
}
