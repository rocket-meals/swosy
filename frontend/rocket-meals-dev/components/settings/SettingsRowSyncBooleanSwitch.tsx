import React, {FunctionComponent} from "react";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {SettingsRowBooleanSwitch} from "./SettingsRowBooleanSwitch";
import {SyncStateKeys, useSyncState} from "@/helper/sync_state_helper/SyncState";
import {Text} from "@/components/Themed";

interface AppState {
    accessibilityLabel: string,
    label: string,
    leftIconOn?: string,
    leftIconOff?: string,
    variable: SyncStateKeys,
    onPress?: (nextValue: boolean) => void,
}
export const SettingsRowSyncBooleanSwitch: FunctionComponent<AppState & SettingsRowProps> = ({leftIcon,...props}) => {

    const [isCheckedRaw, setIsChecked] = useSyncState<boolean>(props.variable);
    const isChecked = isCheckedRaw===true

    let useLeftIcon = leftIcon;
    if(isChecked && !!props.leftIconOn){
        useLeftIcon = props.leftIconOn;
    }
    if(!isChecked && !!props.leftIconOff){
        useLeftIcon = props.leftIconOff;
    }

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
        <SettingsRowBooleanSwitch leftIcon={useLeftIcon} {...props} value={isChecked} onPress={onPress} />
    )
}
