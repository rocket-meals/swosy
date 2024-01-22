import React, {FunctionComponent, useState} from "react";
import {
    AccessibilityRole,
    AccessibilityState,
    GestureResponderEvent,
    TouchableOpacity,
    ViewProps
} from "react-native";
import {Icon, View, Text} from "@/components/Themed";

import {Tooltip} from "@gluestack-ui/themed";
import {GestureEvent} from "react-native-gesture-handler";


// MyTouchableOpacityProps extends TouchableOpacityProps with
// - accessibilityLabel: required
// - accessibilityRole: default 'button'
export type MyTouchableOpacityProps = {
    disabled?: boolean,
    accessibilityLabel: string,
    accessibilityRole?: AccessibilityRole,
    accessibilityHint?: string,
    accessibilityState?: AccessibilityState,
    onPress?: () => void | ((event: GestureResponderEvent) => void)
    style?: ViewProps["style"]
    styled?: ViewProps["style"]
    children?: React.ReactNode
}

export const MyTouchableOpacity = ({disabled, accessibilityRole, accessibilityLabel, onPress, style ,...props}: MyTouchableOpacityProps) => {

    let mergedStyle: ViewProps["style"] = {

    };
    if(Array.isArray(style)){
        for(let singleStyle of style){
            // @ts-ignore
            mergedStyle = {...mergedStyle, ...singleStyle};
        }
    } else {
        // @ts-ignore
        mergedStyle = {...mergedStyle, ...style};
    }

    if(disabled) {
        // @ts-ignore
        mergedStyle = {...mergedStyle,
            cursor: "not-allowed",
        };
    }

    return(
        // TODO: add tooltip support
            <TouchableOpacity onPress={onPress} accessibilityState={props?.accessibilityState} accessibilityHint={props?.accessibilityHint} accessibilityRole={accessibilityRole ?? 'button'} accessibilityLabel={accessibilityLabel} style={mergedStyle} disabled={disabled}  {...props}>
                {props?.children}
            </TouchableOpacity>
    )

}
