import React, {FunctionComponent} from "react";
import {
    useGlobalActionSheetSettingProfileCanteen
} from "@/compositions/settings/UseGlobalActionSheetSettingProfileCanteen";
import {IconNames} from "@/constants/IconNames";
import {MyButton} from "@/components/buttons/MyButton";
import {View} from "@/components/Themed";
import {useEditProfileCanteenAccessibilityLabel} from "@/compositions/settings/SettingsRowProfileCanteen";

interface AppState {

}
export const SettingsButtonProfileCanteen: FunctionComponent<AppState> = ({...props}) => {

    const accessibilityLabel = useEditProfileCanteenAccessibilityLabel();
    const tooltip = useEditProfileCanteenAccessibilityLabel();

    const onPress = useGlobalActionSheetSettingProfileCanteen();

    //                <MyButton
    //                     useOnlyNecessarySpace={true} accessibilityLabel={"Canteen"} leftIcon={IconNames.canteen_icon} {...props} onPress={onPress} />

    return(
        <MyButton tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.canteen_icon} {...props} onPress={onPress} />
    )
}
