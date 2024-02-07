import {Icon, useTextContrastColor, useViewBackgroundColor, View, Text} from '@/components/Themed';
import React, {useState} from "react";
import {ActionsheetItem, ActionsheetItemText} from "@gluestack-ui/themed";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {ViewStyle} from "react-native";

export type MyNewButtonProps = {
    isActive: boolean,
    onPress?: () => Promise<void> | void,
    accessibilityLabel: string,
    text?: string,
    leftIcon?: string,
    leftIconActive?: string,
    rightIcon?: string,
    rightIconActive?: string,
    // prop to tell to use only the necessary space
    useOnlyNecessarySpace?: boolean,
}
export const MyNewButton = ({isActive, onPress, accessibilityLabel, text, leftIcon, leftIconActive, rightIcon, rightIconActive, useOnlyNecessarySpace}: MyNewButtonProps) => {
    const viewBackgroundColor = useViewBackgroundColor()
    const textColor = useTextContrastColor()
    const projectColor = useProjectColor()

    const [hovered, setHovered] = useState<boolean>(false)

    // When active
    const activeBackgroundColor = projectColor
    const activeTextColor = useMyContrastColor(activeBackgroundColor)

    // When active and hovered
    const lighterOrDarkerActiveBackgroundColor = useLighterOrDarkerColorForSelection(activeBackgroundColor)
    const lighterOrDarkerActiveTextColor = useMyContrastColor(lighterOrDarkerActiveBackgroundColor)

    // When not active and not hovered
    const inactiveBackgroundColor = viewBackgroundColor || "transparent"
    const inactiveTextColor = textColor

    // When not active and hovered
    const lighterOrDarkerInactiveBackgroundColor = useLighterOrDarkerColorForSelection(inactiveBackgroundColor)
    const lighterOrDarkerInactiveTextColor = useMyContrastColor(lighterOrDarkerInactiveBackgroundColor)

    let usedViewBackgroundColor: string;
    let usedTextColor: string;

    if(isActive){
        if(hovered){
            usedViewBackgroundColor = lighterOrDarkerActiveBackgroundColor
            usedTextColor = lighterOrDarkerActiveTextColor
        } else {
            usedViewBackgroundColor = activeBackgroundColor
            usedTextColor = activeTextColor
        }
    } else {
        if(hovered){
            usedViewBackgroundColor = lighterOrDarkerInactiveBackgroundColor
            usedTextColor = lighterOrDarkerInactiveTextColor
        } else {
            usedViewBackgroundColor = inactiveBackgroundColor
            usedTextColor = inactiveTextColor
        }
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

    return(
        <View style={
            outerViewStyle
        }>
            <ActionsheetItem
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}

                accessibilityLabel={accessibilityLabel}

                style={{
                    borderColor: projectColor,
                    borderWidth: 1,
                    backgroundColor: usedViewBackgroundColor,
                }}
                onPress={onPress}>
                <ActionsheetItemText><Icon color={usedTextColor} name={leftIconUsed} /></ActionsheetItemText>
                <View style={innerViewStyle}>
                    <ActionsheetItemText selectable={true} sx={{
                        color: usedTextColor,
                    }}>{text}</ActionsheetItemText>
                </View>
                <ActionsheetItemText><Icon color={usedTextColor} name={rightIconUsed} /></ActionsheetItemText>
            </ActionsheetItem>
        </View>
    )

    /**

     */
}