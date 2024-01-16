import React, {FunctionComponent} from "react";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {SettingsRowBooleanSwitch} from "./SettingsRowBooleanSwitch";
import {SyncStateKeys, useSyncState} from "@/helper/sync_state_helper/SyncState";
import {Text} from "@/components/Themed";

interface AppState {
    accessibilityLabel: string,
    variable: SyncStateKeys,
    onPress?: (nextValue: boolean) => void,
}
export const SettingsRowSyncBooleanSwitch: FunctionComponent<AppState & SettingsRowProps> = (props) => {

    const [isCheckedRaw, setIsChecked] = useSyncState<boolean>(props.variable);
    const isChecked = isCheckedRaw===true

    function onPress(nextValue: boolean){
        if(nextValue){
            setIsChecked(true);
        } else {
            setIsChecked(false);
        }
        if(!!props.onPress){
            props.onPress(nextValue);
        }
    }

    return(
        <SettingsRowBooleanSwitch {...props} value={isChecked} onPress={onPress} />
    )
}
