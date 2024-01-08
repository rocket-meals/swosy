import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {StringHelper} from "../../helper/StringHelper";

interface AppState {

}
export const SettingsSpacer: FunctionComponent<AppState> = (props) => {

    return(
        <View><Text>{StringHelper.renderZeroSpaceHeight(1)}</Text></View>
    )
}
