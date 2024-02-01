import React, {FunctionComponent} from "react";
import {Icon, useTextContrastColor, useViewBackgroundColor, View} from "@/components/Themed";
import {ActionsheetItem, ActionsheetItemText, Divider} from "@gluestack-ui/themed";
import {AccessibilityRole} from "react-native";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";

export interface SettingsRowProps {
    key?: any;
    children?: any;
    label: string,
    labelRight?: string,
    leftContent?: string | any,
    rightContent?: string | any,
    leftIcon?: any | string,
    rightIcon?: any,
    onPress?: any,
    color?: any
    hideLeftContent?: boolean,
    expandable?: boolean,
    expanded?: boolean,
    customDivider?: any,
    accessibilityLabel: string,
    accessibilityRole?: AccessibilityRole | undefined,
    accessibilityState?: any,
    flex?: number,
    shadeLevel?: number
}
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {

    const viewBackgroundColor = useViewBackgroundColor()
    const textColor = useTextContrastColor()
    const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
    const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
    const projectColor = useProjectColor()
    const projectColorContrast = useMyContrastColor(projectColor)

    function renderRightIcon(showPress: boolean){
        let rightIcon = props?.rightIcon
        if(showPress && !rightIcon){
            rightIcon = <Icon name={"chevron-right"} />;
        }
        if(rightIcon && typeof props?.rightIcon === "string"){
            return <Icon name={props.rightIcon} />
        }
        return rightIcon
    }

    let isActive = false
    const usedViewBackgroundColor = isActive ? projectColor : viewBackgroundColor;
    let usedTextColor = isActive ? projectColorContrast : textColor;

    let item = {
        key: props?.key,
        icon: props.leftIcon,
        label: props.label,
        accessibilityLabel: props.accessibilityLabel,
        onSelect: props.onPress,
        leftIcon: props.leftIcon,
    }

    let renderedLeftIcon = <Icon color={textColor} name={item.icon} />
    if(isActive){
        renderedLeftIcon = <Icon color={projectColorContrast} name={item.icon} />
    }

    const expanded = props.expanded;
    const children = props.children;

    let renderedChildren = null;
    if(expanded){
        renderedChildren = children;
    }

    return <>
        <ActionsheetItem
        accessibilityLabel={item.accessibilityLabel}
        sx={{
            bg: usedViewBackgroundColor,
            ":hover": {
                bg: lighterOrDarkerBackgroundColor,
            },
        }}
        key={item.key} onPress={item.onSelect} >
        <ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
        <View style={{
            flex: 1
        }}>
            <ActionsheetItemText sx={{
                color: usedTextColor,
            }}>{item.label}</ActionsheetItemText>
        </View>
            <ActionsheetItemText sx={{
                color: usedTextColor,
            }}>{props.labelRight}</ActionsheetItemText>
        <ActionsheetItemText>{renderRightIcon(!!props.onPress)}</ActionsheetItemText>
    </ActionsheetItem>
        {renderedChildren}
        <Divider />
        </>
}
