import {Icon, useTextContrastColor, useViewBackgroundColor, View, Text} from '@/components/Themed';
import React, {useState} from "react";
import {ActionsheetItem, ActionsheetItemText} from "@gluestack-ui/themed";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/states/ProjectInfo";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {ViewStyle} from "react-native";
import {MyButtonCustom} from "@/components/buttons/MyButtonCustom";

export type MyNewButtonProps = {
    isActive?: boolean,
    onPress?: () => Promise<void> | void,
    accessibilityLabel: string,
    text?: string,
    leftIcon?: string,
    leftIconActive?: string,
    rightIcon?: string,
    rightIconActive?: string,
    useOnlyNecessarySpace?: boolean,
    disabled?: boolean,
    leftIconColoredBox?: boolean,
    tooltip?: string,
    useTransparentBorderColor?: boolean,
    useTransparentBackgroundColor?: boolean,
    backgroundColor?: string,
}
export const MyButton = (props: MyNewButtonProps) => {
    const viewBackgroundColor = useViewBackgroundColor()
    const textColor = useTextContrastColor()
    const projectColor = useProjectColor()

    // When active
    let activeBackgroundColor = props?.backgroundColor || projectColor
    const activeTextColor = useMyContrastColor(activeBackgroundColor)

    // When active and hovered
    const activeHoveredBackgroundColor = useLighterOrDarkerColorForSelection(activeBackgroundColor)
    const activeHoveredTextColor = useMyContrastColor(activeHoveredBackgroundColor)

    // When not active and not hovered
    const inactiveBackgroundColor = viewBackgroundColor || "transparent"
    const inactiveTextColor = textColor

    // When not active and hovered
    const inactiveHoveredBackgroundColor = useLighterOrDarkerColorForSelection(inactiveBackgroundColor)
    const inactiveHoveredTextColor = useMyContrastColor(inactiveHoveredBackgroundColor)

    let activeBorderColor = activeBackgroundColor
    let inactiveBorderColor = activeBackgroundColor

    if(props?.useTransparentBorderColor){
        activeBorderColor = "transparent"
        inactiveBorderColor = "transparent"
    }

    return <MyButtonCustom {...props}
                           activeBorderColor={activeBorderColor} inactiveBorderColor={inactiveBorderColor}
                           activeBackgroundColor={activeBackgroundColor} activeTextColor={activeTextColor}
                           activeHoveredBackgroundColor={activeHoveredBackgroundColor} activeHoveredTextColor={activeHoveredTextColor}
                           inactiveBackgroundColor={inactiveBackgroundColor} inactiveTextColor={inactiveTextColor}
                           inactiveHoveredBackgroundColor={inactiveHoveredBackgroundColor} inactiveHoveredTextColor={inactiveHoveredTextColor}
    />
}