import React, {FunctionComponent} from "react";
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {
    getMyColorSchemeNameOptions, MyColorSchemeName, useMyColorSchemeNameDetermined,
    useMyColorSchemeSavedOption, useThemeDetermined
} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {Text} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

interface AppState {

}
export const SettingsRowColorScheme: FunctionComponent<AppState> = ({...props}) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const title = useTranslation(TranslationKeys.color_scheme)

    let availableThemeKeys = getMyColorSchemeNameOptions()
    let [savedColorSchemeOption, setColorSchemeOption] = useMyColorSchemeSavedOption()
    let colorSchemeDetermined = useMyColorSchemeNameDetermined();
    const theme = useThemeDetermined()
    const isDebug = useIsDebug()

    const color_scheme_light = useTranslation(TranslationKeys.color_scheme_light)
    const color_scheme_dark = useTranslation(TranslationKeys.color_scheme_dark)
    const color_scheme_system = useTranslation(TranslationKeys.color_scheme_system)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const colorSchemeKeyToName = {
        [MyColorSchemeName.Light]: color_scheme_light,
        [MyColorSchemeName.Dark]: color_scheme_dark,
        [MyColorSchemeName.System]: color_scheme_system
    }

    let selectedThemeName = colorSchemeKeyToName[savedColorSchemeOption]

    const accessibilityLabel = translation_edit+": "+title + " " + selectedThemeName
    const label = title

    let items = []
    for(let key of availableThemeKeys){
        let label = colorSchemeKeyToName[key]
        items.push({
            key: key,
            label: label,
            onSelect: async (key) => {
                setColorSchemeOption(key)
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
                    <Text>{"savedColorSchemeOption: "+savedColorSchemeOption}</Text>
                    <Text>{"selectedThemeName: "+selectedThemeName}</Text>
                    <Text>{"colorSchemeDetermined: "+colorSchemeDetermined}</Text>
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
