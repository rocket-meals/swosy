// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Text} from "native-base";

export const SettingsRowFlexWrapText: FunctionComponent = (props) => {

    const defaultStyle = {
        flex: 1,
        width: 1
    }

    const style = {...defaultStyle, ...props?.style}

    return(
        <Text style={style}>
            {props.children}
        </Text>
    )
}
