import React, {FunctionComponent} from "react";
import {Tooltip, View} from "native-base";
import {TouchableOpacity} from "react-native";
import {useAppTranslation} from "../translations/AppTranslation";
import {MyActionsheet} from "../../../kitcheningredients";
import {SimpleDatePickerComponent} from "./SimpleDatePickerComponent";
import {ProfileAPI, useSynchedProfile} from "../profile/ProfileAPI";
import {DateHelper} from "../../helper/DateHelper";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";
import {ColorHelper} from "../../helper/ColorHelper"

export interface SimpleDatePickerProps {
    currentDate: Date,
    onSelectDate?: any,
    renderDate?: (dateToRender: Date, referenceDate: Date, onClose: any) => any,
    accessibilityLabel?: string,
}
export const SimpleDatePicker: FunctionComponent<SimpleDatePickerProps> = (props) => {

    const actionsheet = MyActionsheet.useActionsheet();
    const selectDateTranslation = useAppTranslation("selectDate");
    const yearTranslation = useAppTranslation("year");
    const monthTranslation = useAppTranslation("month");
    const selectedTranslation = useAppTranslation("selected");

    const currentDate = props?.currentDate;
    const formatedSelectedDate = DateHelper.formatOfferDateToReadable(currentDate, true);
    const accessibilityLabel = props?.accessibilityLabel || formatedSelectedDate;

    const [profile, setProfile] = useSynchedProfile();
    let locale = ProfileAPI.getLocaleForJSDates(profile);

    const selectedDateColor = ColorHelper.useProjectColor()
    const selectedTextColor = ColorHelper.useContrastColor(selectedDateColor);

    const weekdayBackgroundColor = ColorHelper.useProjectColor();
    const weekdayTextColor = ColorHelper.useContrastColor(weekdayBackgroundColor);

    return(
        <TouchableOpacity
            style={ImageOverlayPaddingStyle}
            accessibilityHint={selectDateTranslation}
            accessibilityLabel={accessibilityLabel}
            onPress={() => {
            actionsheet.show({
                title: selectDateTranslation,
                renderCustomContent: (onClose) => {
                    return <SimpleDatePickerComponent
                        onClose={onClose}
                        currentDate={props.currentDate}
                        selectedTextColor={selectedTextColor}
                        selectedDateColor={selectedDateColor}
                        weekdayBackgroundColor={weekdayBackgroundColor}
                        weekdayTextColor={weekdayTextColor}
                        onSelectDate={props.onSelectDate}
                        renderDate={props.renderDate}
                        locale={locale}
                        yearTranslation={yearTranslation}
                        monthTranslation={monthTranslation}
                        selectedTranslation={selectedTranslation}
                    />
                }
            }, {});
        }}>
            <View>
                <Tooltip label={selectDateTranslation} >
                    {props.children}
                </Tooltip>
            </View>
        </TouchableOpacity>
    )
}
