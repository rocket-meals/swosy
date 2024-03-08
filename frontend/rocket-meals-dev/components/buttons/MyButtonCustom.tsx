import {Icon, Text, View} from '@/components/Themed';
import React, {useState} from "react";
import {Tooltip, TooltipContent, TooltipText} from "@gluestack-ui/themed";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {Pressable, ViewStyle} from "react-native";
import {MyNewButtonProps} from "@/components/buttons/MyButton";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {useIsDebug} from "@/states/Debug";

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
} & MyNewButtonProps // TODO change this to merge with MyButton
export const MyButtonCustom = ({centerItems, icon, isActive, borderLeftRadius, borderRightRadius, tooltip, disabled, leftIconColoredBox, onPress, accessibilityLabel, text, leftIcon, activeBorderColor, inactiveBorderColor, leftIconActive, rightIcon, rightIconActive, useOnlyNecessarySpace, activeHoveredBackgroundColor, inactiveHoveredBackgroundColor, activeHoveredTextColor, inactiveHoveredTextColor, inactiveBackgroundColor, inactiveTextColor, activeTextColor, activeBackgroundColor, borderRadius}: MyNewButtonPropsCustom) => {
    const [hovered, setHovered] = useState<boolean>(false)
    const [isPressed, setIsPressed] = useState<boolean>(false)

    const isDebug = useIsDebug()

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
            if(leftIconColoredBox){
                usedIconBoxBackgroundColor = activeBackgroundColor
                usedIconBoxTextColor = activeTextColor
            } else {
                usedIconBoxBackgroundColor = inactiveBackgroundColor
                usedIconBoxTextColor = inactiveTextColor
            }
        }
        usedBorderColor = inactiveBorderColor
    }

    if(isDebug){
        usedBorderColor = "red"
    }


    let leftIconUsed = leftIcon;
    if(isActive && leftIconActive){
        leftIconUsed = leftIconActive
    }
    let rightIconUsed = rightIcon;
    if(isActive && rightIconActive){
        rightIconUsed = rightIconActive
    }


    let defaultBorderRadius = 6;
    let defaultPadding = 12;

    let defaultInnerStyle: StyleProp<ViewStyle> = {
        flexDirection: "row",
    }


    let usedInnerViewStyle: StyleProp<ViewStyle> = [defaultInnerStyle]

    let pressedStyle: StyleProp<ViewStyle> = {
        opacity: isPressed ? 0.5 : 1,
    }


    let disabledStyle: StyleProp<ViewStyle> = {
        // @ts-ignore // This is a valid style on web
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
    }


    let leftIconPaddingRight = defaultPadding
    let leftIconPaddingLeft = defaultPadding

    let leftIconViewStyle: StyleProp<ViewStyle> = {
        backgroundColor: leftIconColoredBox ? usedIconBoxBackgroundColor : undefined,
        paddingRight: leftIconPaddingRight,
        paddingLeft: leftIconPaddingLeft,
        paddingVertical: defaultPadding,
        justifyContent: "center",
    }

    let leftItem: any = undefined
    if(leftIcon){
        leftItem = <View style={leftIconViewStyle}>
            <Icon color={usedIconBoxTextColor} name={leftIconUsed} />
        </View>
    }

    let renderedText: any = null;
    if(text){
        renderedText = <View style={{
            marginVertical: defaultPadding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
            marginLeft: defaultPadding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
            marginRight: defaultPadding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
            flexDirection: 'row', flexWrap: 'wrap',

        }}>
            <Text style={{
                flexShrink: 1,
                color: usedTextColor,
            }}>{text}</Text>
        </View>
    }

    if(icon) {
        renderedText = <View style={{
            marginVertical: defaultPadding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
            marginLeft: defaultPadding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
            marginRight: defaultPadding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
            flexDirection: 'row', flexWrap: 'wrap',

        }}>
            <Icon name={icon} color={usedTextColor} />
        </View>
    }

    let rightIconViewStyle: StyleProp<ViewStyle> = {
        paddingRight: leftIconPaddingRight,
        paddingLeft: (!!text || !!leftIcon) ? 0 : defaultPadding,
        paddingVertical: defaultPadding,
        justifyContent: "center",
    }

    let rightItem: any = undefined
    if(rightIcon){
        rightItem = <View style={rightIconViewStyle}>
            <Icon color={usedIconBoxTextColor} name={rightIconUsed} />
        </View>
    }


    /**
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
     borderRadius: defaultBorderRadius,
     }}
     onPress={onPress}>
     <View style={usedInnerViewStyle}>
     {leftItem}
     {renderedText}
     {rightItem}
     </View>
     </ActionsheetItem>
     * @param triggerProps
     */

    const renderButton = (triggerProps: any) => (
            <Pressable
                {...triggerProps}
                disabled={disabled}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}

                accessibilityLabel={accessibilityLabel}

                style={
                    [disabledStyle, pressedStyle,                 {
                        borderColor: usedBorderColor,
                        borderWidth: 1,
                        backgroundColor: usedViewBackgroundColor,
                        justifyContent: "flex-start",
                        alignSelf: useOnlyNecessarySpace ? "flex-start" : undefined,
                        overflow: "hidden",
                        borderRadius: borderRadius ?? defaultBorderRadius,
                        borderBottomLeftRadius: borderLeftRadius,
                        borderTopLeftRadius: borderLeftRadius,
                        borderBottomRightRadius: borderRightRadius,
                        borderTopRightRadius: borderRightRadius,
                        flexDirection: "row",
                        //height: "100%",
                        flexShrink: 1,
                    }]
            }
                onPress={onPress}
            >
                {leftItem}
                <View style={{
                    justifyContent: "center",
                    alignItems: centerItems ? "center" : "flex-start",
                    // and make sure the text gets wrapped if it is too long
                    flexShrink: 1,
                    flexGrow: PlatformHelper.isWeb() ? 1 : useOnlyNecessarySpace ? 0 : 1,
                }}>
                    {renderedText}
                </View>
                {rightItem}
            </Pressable>
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