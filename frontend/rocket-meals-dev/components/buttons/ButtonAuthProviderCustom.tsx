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
    style?: ViewProps["style"],
    key: string
}

// The component to handle SSO login links
export const ButtonAuthProviderCustom = ({ key, text, accessibilityLabel, onPress, icon_family, icon_name, disabled, children, style }: ButtonAuthProviderCustomProps) => {
    const projectColorContrast = useProjectColorContrast();

    let backgroundColor = "#FFFFFF"
    let textContrastColor = useMyContrastColor(backgroundColor);

    let contentRows = [];

    contentRows.push(
        <View style={{flex: 1, justifyContent: "center", paddingLeft: 20}}>
            <Text style={{color: textContrastColor}} >{text}</Text>
        </View>
    )

    return(
        <MyButton key={key} style={{marginVertical: 5, paddingHorizontal: 10, backgroundColor: backgroundColor}} onPress={onPress} disabled={disabled} accessibilityLabel={accessibilityLabel} leftIconName={icon_name} leftIconFamily={icon_family} leftIconColor={projectColorContrast}>
            {contentRows}
        </MyButton>
    )
};