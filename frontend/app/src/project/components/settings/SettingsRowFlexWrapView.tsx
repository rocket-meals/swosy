// @ts-nocheck
import React, {FunctionComponent} from "react";
import {View} from "native-base";

export const SettingsRowFlexWrapView: FunctionComponent = (props) => {

    const defaultStyle = {
        flex: 1,
        flexDirection: "row",
    }

    const style = {...defaultStyle, ...props?.style}

    return(
        <View style={style}>
            {props.children}
        </View>
    )
}
