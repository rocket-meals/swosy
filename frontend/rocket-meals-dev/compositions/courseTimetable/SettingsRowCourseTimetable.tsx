import React, {FunctionComponent} from "react";
import {getCourseTimetableVisiblity} from "./CourseTimetableHelper";
import {useSettingTranslationCourseTimetable} from "./SettingTranslationCourseTimetable";
import {SettingsRowNavigator} from "../settings/SettingsRowNavigator";
import {CourseTimetableIcon} from "./CourseTimetableIcon";
import {SettingCourseTimetable} from "../../screens/settings/SettingCourseTimetable";

export const SettingsRowCourseTimetable: FunctionComponent = (props) => {

    const courseTimetableVisiblity = getCourseTimetableVisiblity();
    const translation = useSettingTranslationCourseTimetable()

    if(!courseTimetableVisiblity){
        return null;
    } else {
        return <SettingsRowNavigator accessibilityLabel={translation} destinationComponent={SettingCourseTimetable} leftContent={translation} leftIcon={<CourseTimetableIcon />} />
    }
}
