import React, {FunctionComponent} from "react";
import {Layout, useSynchedJSONState} from "../../../kitcheningredients";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {Switch} from "native-base";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {PlatformHelper} from "../../helper/PlatformHelper";
import {SettingsRowBooleanSwitch} from "./SettingsRowBooleanSwitch";

interface AppState {
    variable: string,
    onPress?: any,
}
export const SettingsRowSynchedBooleanSwitch: FunctionComponent<AppState & SettingsRowProps> = (props) => {

    const [isCheckedRaw, setIsChecked] = useSynchedJSONState(props?.variable);
    const isChecked = isCheckedRaw===true

    function onPress(nextValue){
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
