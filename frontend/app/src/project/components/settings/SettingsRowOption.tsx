// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
    active?: boolean
}
export const SettingsRowOption: FunctionComponent<SettingsRowProps & AppState> = ({active, ...props}) => {

    const selectionIconName = active ? "checkbox-marked-circle" : "checkbox-blank-circle-outline";
    const selectionIcon = <Icon name={selectionIconName}  />

    return (
        <SettingsRow accessibilityState={{checked: active}} accessibilityRole={AccessibilityRoles.checkbox} {...props} rightIcon={selectionIcon}/>
    )
}
