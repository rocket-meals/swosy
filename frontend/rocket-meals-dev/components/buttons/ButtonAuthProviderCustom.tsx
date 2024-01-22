import React from 'react';
import {Text} from "@/components/Themed";
import {useProjectColorContrast} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {MyButton} from "@/components/buttons/MyButton";
import {GestureResponderEvent} from "react-native";

// Define the type for Single Sign-On (SSO) providers
type ButtonAuthProviderCustomProps = {
    onPress?: () => void | ((event: GestureResponderEvent) => void),
    accessibilityLabel: string,
    text: string,
    icon_name: string,
    icon_family?: string,
    disabled?: boolean,
    children?: React.ReactNode
}

// The component to handle SSO login links
export const ButtonAuthProviderCustom = ({ text, accessibilityLabel, onPress, icon_family, icon_name, disabled, children }: ButtonAuthProviderCustomProps) => {
    const projectColorContrast = useProjectColorContrast();

    let contentRows = [];

    contentRows.push(
        <Text key={"loginWithText"} >{text}</Text>
    )

    return(
        <MyButton onPress={onPress} disabled={disabled} accessibilityLabel={accessibilityLabel} leftIconName={icon_name} leftIconFamily={icon_family} leftIconColor={projectColorContrast}>
            {contentRows}
            {children}
        </MyButton>
    )
};