import React, {FunctionComponent} from "react";
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {
    getMyColorSchemeNameOptions, MyColorSchemeName, useMyColorSchemeNameDetermined,
    useMyColorSchemeSavedOption, useThemeDetermined
} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {Text} from "@/components/Themed";

interface AppState {

}
export const SettingsRowTheme: FunctionComponent<AppState> = ({...props}) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()
    let accessibilityLabel = "Theme Changer" // TODO: translate using our translation system

    let availableThemeKeys = getMyColorSchemeNameOptions()
    let [savedColorSchemeOption, setColorSchemeOption] = useMyColorSchemeSavedOption()
    let colorSchemeDetermined = useMyColorSchemeNameDetermined();
    const theme = useThemeDetermined()
    const isDebug = useIsDebug()

    const themeKeyToName = {
        [MyColorSchemeName.Dark]: "Dark", // TODO: translate using our translation system
        [MyColorSchemeName.Light]: "Light",
        [MyColorSchemeName.System]: "System",
    }

    let selectedThemeName = themeKeyToName[savedColorSchemeOption]

    let items = []
    for(let key of availableThemeKeys){
        let label = themeKeyToName[key]
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
        title: "Theme: "+selectedThemeName,
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

    return(
        <>
            <SettingsRowActionsheet config={config} accessibilityLabel={accessibilityLabel} {...props}  />
            {renderDebug()}
        </>
    )
}
