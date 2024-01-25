import React, {FunctionComponent} from "react";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";

interface AppState {
    accessibilityLabel: string,
    debug?: boolean,
    disabled?: boolean
    config: MyGlobalActionSheetConfig
}
export const SettingsRowActionsheet: FunctionComponent<AppState & SettingsRowProps> = ({config, accessibilityLabel,...props}) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show(config)
    }

    const iconRight = "chevron-right"

    return(
        <SettingsRow accessibilityLabel={accessibilityLabel} rightIcon={iconRight} {...props} onPress={onPress} />
    )
}
