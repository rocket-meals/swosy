// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../translations/AppTranslation";
import {Text} from "native-base";
import {useBackgroundColor} from "../../../kitcheningredients";
import {ColorHelper} from "../../helper/ColorHelper";

export const useSettingTranslationCourseTimetable = () => {
    const translationsSettings = useAppTranslation("settings")
    const translationsCourseTimetable = useAppTranslation("screenNameCourseTimetable")
    return translationsCourseTimetable+" "+translationsSettings
}

export const SettingTranslationCourseTimetable: FunctionComponent<AppTranslationProps> = (props) => {
    const translation = useSettingTranslationCourseTimetable()

    const dynamicBackgroundColor = useBackgroundColor()
    const contrastColor = ColorHelper.useContrastColor(props?.backgroundColor || dynamicBackgroundColor);
    let dynamicColor = props?.color || contrastColor;

    return <Text color={dynamicColor}>{translation}</Text>
}
