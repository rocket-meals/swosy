import React from 'react';
import {Text, View} from "@/components/Themed";
import {useProjectColorContrast} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {MyButton} from "@/components/buttons/MyButton";
import {GestureResponderEvent, ViewProps, ViewStyle} from "react-native";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

// Define the type for Single Sign-On (SSO) providers
type ButtonAuthProviderCustomProps = {
    onPress?: () => void | ((event: GestureResponderEvent) => void),
    accessibilityLabel: string,
    text: string,
    icon_name: string,
    icon_family?: string,
    disabled?: boolean,
    children?: React.ReactNode
    style?: ViewProps["style"]
}

// The component to handle SSO login links
export const ButtonAuthProviderCustom = ({ text, accessibilityLabel, onPress, icon_family, icon_name, disabled, children, style }: ButtonAuthProviderCustomProps) => {
    return(
        <MyButton text={text} onPress={onPress} disabled={disabled} accessibilityLabel={accessibilityLabel} leftIconName={icon_name} leftIconFamily={icon_family}>
        </MyButton>
    )
};