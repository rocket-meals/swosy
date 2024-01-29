import React, {FunctionComponent, useState} from "react";
import {
    AccessibilityRole,
    AccessibilityState,
    GestureResponderEvent,
    TouchableOpacity,
    ViewProps
} from "react-native";
import {Icon, View, Text} from "@/components/Themed";

import {Tooltip, TooltipContent, TooltipText} from "@gluestack-ui/themed";
import {GestureEvent} from "react-native-gesture-handler";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";


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

export const MyTouchableOpacity = ({disabled, accessibilityRole, accessibilityLabel, onPress, style, children ,...props}: MyTouchableOpacityProps) => {

    const isDebug = useIsDebug();

    let mergedStyle: ViewProps["style"] = {

    };
    if(isDebug){
        // @ts-ignore
        mergedStyle = {...mergedStyle,
            borderWidth: 1,
            borderColor: "red",
            // let the borderWidth not affect the size of the element by subtracting 1 from the margin
            margin: mergedStyle.margin ? mergedStyle.margin - 1 : -1,
            marginRight: mergedStyle.marginRight ? mergedStyle.marginRight - 1 : -1,
            marginLeft: mergedStyle.marginLeft ? mergedStyle.marginLeft - 1 : -1,
            marginTop: mergedStyle.marginTop ? mergedStyle.marginTop - 1 : -1,
            marginBottom: mergedStyle.marginBottom ? mergedStyle.marginBottom - 1 : -1,
            marginVertical: mergedStyle.marginVertical ? mergedStyle.marginVertical - 1 : -1,
            marginHorizontal: mergedStyle.marginHorizontal ? mergedStyle.marginHorizontal - 1 : -1,
        };
    }

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

    if(!onPress){
        return <View accessibilityState={props?.accessibilityState} accessibilityHint={props?.accessibilityHint} accessibilityLabel={accessibilityLabel} style={mergedStyle}>
            {children}
        </View>
    }

    return(
        // TODO: add tooltip support
        <Tooltip
            placement="top"
            trigger={(triggerProps) => {
                return (
                    <TouchableOpacity {...triggerProps} onPress={onPress} accessibilityState={props?.accessibilityState} accessibilityHint={props?.accessibilityHint} accessibilityRole={accessibilityRole ?? 'button'} accessibilityLabel={accessibilityLabel} style={mergedStyle} disabled={disabled}  {...props}>
                        {children}
                    </TouchableOpacity>
                )
            }}
        >
            <TooltipContent>
                <TooltipText>{accessibilityLabel}</TooltipText>
            </TooltipContent>
        </Tooltip>
    )

}
