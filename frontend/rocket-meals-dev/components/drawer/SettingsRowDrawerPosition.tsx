import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {
    DrawerConfigPosition,
    getDrawerPositionKeyOptions,
    useDrawerPositionRaw
} from "@/helper/sync_state_helper/custom_sync_states/DrawerSyncConfig";

interface AppState {

}
export const SettingsRowDrawerPosition: FunctionComponent<AppState> = ({...props}) => {

    const colorSchemeIconName = "menu"

    const title = useTranslation(TranslationKeys.drawer_config_position)

    let availableOptionKeys = getDrawerPositionKeyOptions()
    let [savedOptionKey, setSavedOptionKey] = useDrawerPositionRaw()
    const selectedKey = savedOptionKey || DrawerConfigPosition.System
    const isDebug = useIsDebug()

    const translation_direction_left = useTranslation(TranslationKeys.drawer_config_position_left)
    const translation_direction_right = useTranslation(TranslationKeys.drawer_config_position_right)
    const translation_direction_system = useTranslation(TranslationKeys.drawer_config_position_system)
    const translation_select = useTranslation(TranslationKeys.select)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const optionKeyToName: {[key in DrawerConfigPosition]: string}
        = {
        [DrawerConfigPosition.Left]: translation_direction_left,
        [DrawerConfigPosition.Right]: translation_direction_right,
        [DrawerConfigPosition.System]: translation_direction_system
    }

    const optionKeyToIcon: {[key in DrawerConfigPosition]: string}
        = {
        [DrawerConfigPosition.Left]: "format-horizontal-align-left",
        [DrawerConfigPosition.Right]: "format-horizontal-align-right",
        [DrawerConfigPosition.System]: "autorenew"
    }

    let selectedThemeName = optionKeyToName[selectedKey]

    const accessibilityLabel = translation_edit+": "+title + " " + selectedThemeName
    const label = title

    let items = []
    for(let key of availableOptionKeys){
        let label: string = optionKeyToName[key]

        let icon = optionKeyToIcon[key]
        let active = key === selectedKey
        if(key === DrawerConfigPosition.System && selectedKey === undefined){
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
                let nextColorSchemeKey: DrawerConfigPosition = key as DrawerConfigPosition
                setSavedOptionKey(nextColorSchemeKey)
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

    return(
        <>
            <SettingsRowActionsheet label={label} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} rightContent={selectedThemeName} leftIcon={colorSchemeIconName} {...props}  />
        </>
    )
}
