// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../translations/AppTranslation";
import {SettingsRowNavigator} from "./SettingsRowNavigator";
import {SettingMarking} from "../../screens/settings/SettingMarking";
import {MarkingIcon} from "../marking/MarkingIcon";

export const SettingsRowMarking: FunctionComponent = (props) => {

    const translation = useAppTranslation("settingmarking")

    return <SettingsRowNavigator accessibilityLabel={translation} destinationComponent={SettingMarking} leftContent={translation} leftIcon={<MarkingIcon />} />
}
