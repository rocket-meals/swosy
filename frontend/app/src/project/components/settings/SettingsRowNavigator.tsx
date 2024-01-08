// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Icon, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {View} from "native-base";
import {useAppTranslation} from "../translations/AppTranslation";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
    destinationComponent: FunctionComponent,
    destinationParams?: any
    accessibilityLabel: any

}
export const SettingsRowNavigator: FunctionComponent<SettingsRowProps & AppState> = ({accessibilityLabel, ...props}) => {

    let rightIcon = (
        <Icon name={"chevron-right"}  />
    )

    const translationNavigateTo = useAppTranslation("navigateTo")
    const accessibilityLabelWithNavigation = translationNavigateTo+": "+accessibilityLabel;

    return(
        <SettingsRow accessibilityRole={AccessibilityRoles.link} accessibilityLabel={accessibilityLabelWithNavigation} {...props} rightIcon={props?.rightIcon || rightIcon} onPress={() => {
            if(!!props.onPress){
                props.onPress();
            } else {
                Navigation.navigateTo(props.destinationComponent, {showbackbutton: true, ...props?.destinationParams})
//                NavigatorHelper.navigateWithoutParams(props.destinationComponent, false, {showbackbutton: true, ...props?.destinationParams})
            }
        }} />
    )
}
