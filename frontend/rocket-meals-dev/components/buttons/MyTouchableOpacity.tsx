import React, {FunctionComponent, useState} from "react";
import {AccessibilityRole, AccessibilityState, GestureResponderEvent, TouchableOpacity} from "react-native";
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
    style?: any
} & TouchableOpacity['props']



export const MyTouchableOpacity = ({disabled, accessibilityRole, accessibilityLabel, onPress, style ,...props}: MyTouchableOpacityProps) => {

    let mergedStyle = []
    if(Array.isArray(style)){
        mergedStyle = style
    } else {
        mergedStyle.push(style)
    }
    if(disabled){
        mergedStyle.push({
            cursor: "not-allowed",
            //opacity: 0.5
        });
    }

    return(
        // TODO: add tooltip support
        <TouchableOpacity onPress={onPress} accessibilityState={props?.accessibilityState} accessibilityHint={props?.accessibilityHint} accessibilityRole={accessibilityRole ?? 'button'} accessibilityLabel={accessibilityLabel} disabled={disabled} style={mergedStyle} {...props}>
            {props?.children}
        </TouchableOpacity>
    )

}
