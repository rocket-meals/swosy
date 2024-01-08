// @ts-nocheck
import React, {FunctionComponent} from "react";
import {View, Text, Divider} from "native-base";
import {Icon, NavigatorHelper} from "../../../kitcheningredients";
import {TouchableOpacity} from "react-native";
import {MyThemedBox} from "../../../kitcheningredients"
import {ViewPixelRatio} from "../../helper/PixelRatioView";
import {StringHelper} from "../../helper/StringHelper";

interface AppState {

}
export const SettingsSpacer: FunctionComponent<AppState> = (props) => {

    return(
        <View><Text>{StringHelper.renderZeroSpaceHeight(1)}</Text></View>
    )
}
