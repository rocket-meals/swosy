import {Icon, View} from '@/components/Themed';
import React, {useState} from "react";
import {ActionsheetItem, ActionsheetItemText, Tooltip, TooltipContent, TooltipText} from "@gluestack-ui/themed";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {Pressable, ViewStyle} from "react-native";
import {MyNewButtonProps} from "@/components/buttons/MyButton";

export type MyNewButtonPropsCustom = {
    activeBackgroundColor?: string,
    activeTextColor?: string,
    activeHoveredBackgroundColor?: string,
    activeHoveredTextColor?: string,
    inactiveBackgroundColor?: string,
    inactiveTextColor?: string,
    inactiveHoveredBackgroundColor?: string,
    inactiveHoveredTextColor?: string,
    activeBorderColor?: string,
    inactiveBorderColor?: string,
} & MyNewButtonProps
export const MyButtonCustom = ({isActive, tooltip, disabled, leftIconColoredBox, onPress, accessibilityLabel, text, leftIcon, activeBorderColor, inactiveBorderColor, leftIconActive, rightIcon, rightIconActive, useOnlyNecessarySpace, activeHoveredBackgroundColor, inactiveHoveredBackgroundColor, activeHoveredTextColor, inactiveHoveredTextColor, inactiveBackgroundColor, inactiveTextColor, activeTextColor, activeBackgroundColor}: MyNewButtonPropsCustom) => {
    const [hovered, setHovered] = useState<boolean>(false)
    const [isPressed, setIsPressed] = useState<boolean>(false)

    let usedViewBackgroundColor: string | undefined;
    let usedTextColor: string | undefined;
    let usedBorderColor: string | undefined;
    let usedIconBoxBackgroundColor: string | undefined;
    let usedIconBoxTextColor: string | undefined;

    if(isActive){
        if(hovered){
            usedViewBackgroundColor = activeHoveredBackgroundColor
            usedTextColor = activeHoveredTextColor
            usedIconBoxBackgroundColor = activeHoveredBackgroundColor
            usedIconBoxTextColor = activeHoveredTextColor
        } else {
            usedViewBackgroundColor = activeBackgroundColor
            usedTextColor = activeTextColor
            usedIconBoxBackgroundColor = activeBackgroundColor
            usedIconBoxTextColor = activeTextColor
        }
        usedBorderColor = activeBorderColor
    } else {
        if(hovered){
            usedViewBackgroundColor = inactiveHoveredBackgroundColor
            usedTextColor = inactiveHoveredTextColor
            usedIconBoxBackgroundColor = inactiveHoveredBackgroundColor
            usedIconBoxTextColor = inactiveHoveredTextColor
        } else {
            usedViewBackgroundColor = inactiveBackgroundColor
            usedTextColor = inactiveTextColor

            // only used for leftIconColoredBox shall be the active color used
            usedIconBoxBackgroundColor = activeBackgroundColor
            usedIconBoxTextColor = activeTextColor
        }
        usedBorderColor = inactiveBorderColor
    }


    let leftIconUsed = leftIcon;
    if(isActive && leftIconActive){
        leftIconUsed = leftIconActive
    }
    let rightIconUsed = rightIcon;
    if(isActive && rightIconActive){
        rightIconUsed = rightIconActive
    }

    let styleTakeAllSpace: StyleProp<ViewStyle>= {
        flex: 1, // This makes the child take all the space
    }
    let styleUseOnlyNecessarySpace: StyleProp<ViewStyle> = {
        alignSelf: 'flex-start', // This makes the child take only the necessary space
    }

    let outerViewStyle: StyleProp<ViewStyle> = useOnlyNecessarySpace ? styleUseOnlyNecessarySpace : styleTakeAllSpace
    let innerViewStyle: StyleProp<ViewStyle> = useOnlyNecessarySpace ? styleUseOnlyNecessarySpace : styleTakeAllSpace

    let pressedStyle: StyleProp<ViewStyle> = {
        opacity: isPressed ? 0.5 : 1,
    }


    let disabledStyle: StyleProp<ViewStyle> = {
        // @ts-ignore // This is a valid style on web
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
    }

    let defaultBorderRadius = 6;
    let defaultPadding = 12;
    let leftIconViewStyle: StyleProp<ViewStyle> = {
        backgroundColor: leftIconColoredBox ? usedIconBoxBackgroundColor : undefined,
        paddingVertical: defaultPadding,
        paddingLeft: defaultPadding/2,
        paddingRight: defaultPadding/2,
        borderBottomRightRadius: defaultBorderRadius,
        borderTopRightRadius: defaultBorderRadius,
        height: "100%",
        justifyContent: "center",
    }

    let leftItem: any = undefined
    if(leftIcon){
        leftItem = <View style={leftIconViewStyle}>
            <ActionsheetItemText><Icon color={usedIconBoxTextColor} name={leftIconUsed} /></ActionsheetItemText>
        </View>
    } else {
        leftItem = <View style={{
            paddingVertical: defaultPadding,
            paddingLeft: defaultPadding
        }}>
        </View>
    }

    let rightItem: any = undefined
    if(rightIcon){
        rightItem = <View style={{
            paddingVertical: defaultPadding,
            paddingRight: defaultPadding
        }}>
            <ActionsheetItemText><Icon color={usedTextColor} name={rightIconUsed} /></ActionsheetItemText>
        </View>
    } else {
        rightItem = <View style={{
            paddingVertical: defaultPadding,
            paddingRight: defaultPadding
        }}>
        </View>
    }

    const renderButton = (triggerProps: any) => (
        <View style={
            [outerViewStyle, disabledStyle, pressedStyle]
        }>
            <ActionsheetItem
                {...triggerProps}
                disabled={disabled}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}

                accessibilityLabel={accessibilityLabel}

                style={{
                    borderColor: usedBorderColor,
                    borderWidth: 1,
                    backgroundColor: usedViewBackgroundColor,
                    padding: 0,
                    margin: 0,
                    overflow: "hidden",
                    borderRadius: defaultBorderRadius
                }}
                onPress={onPress}>
                {leftItem}
                <View style={[innerViewStyle, {
                    paddingVertical: defaultPadding,
                }]}>
                    <ActionsheetItemText selectable={true} sx={{
                        color: usedTextColor,
                    }}>{text}</ActionsheetItemText>
                </View>
                {rightItem}
            </ActionsheetItem>
        </View>
    )

    if(!!tooltip){
        return (
            <Tooltip
                placement="top"
                trigger={(triggerProps) => {
                    return renderButton(triggerProps)
                }}
            >
                <TooltipContent>
                    <TooltipText>{tooltip}</TooltipText>
                </TooltipContent>
            </Tooltip>
        )
    } else {
        return renderButton({})
    }
}