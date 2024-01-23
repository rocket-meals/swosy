import React, {FunctionComponent} from "react";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";

interface AppState {
    value: boolean,
    accessibilityLabel: string,
    debug?: boolean,
    disabled?: boolean

}
export const SettingsRowActionsheet: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel,...props}) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show({
            onCancel: undefined,
            visible: true,
            title: accessibilityLabel,
                    items: [
                        {
                            key: "1",
                            label: "1",
                            onSelect: async (key) => {
                                return true
                            }
                        },
                        {
                            key: "2",
                            label: "2",
                            onSelect: async (key) => {
                                return true
                            }
                        },
                    ]
                })
    }

    return(
        <SettingsRow accessibilityLabel={accessibilityLabel} {...props} onPress={onPress} />
    )
}
