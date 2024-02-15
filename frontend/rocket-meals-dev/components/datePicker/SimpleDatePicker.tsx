import React, {FunctionComponent} from "react";
import {TouchableOpacity} from "react-native";
import {SimpleDatePickerComponent} from "./SimpleDatePickerComponent";
import {MyGlobalActionSheetItem, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DateHelper} from "@/helper/date/DateHelper";
import {useProfileLocaleForJsDate, useSynchedProfile} from "@/states/SynchedProfile";
import {useProjectColor, useProjectColorContrast} from "@/states/ProjectInfo";
import {View} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";

export interface SimpleDatePickerProps {
    currentDate: Date,
    onSelectDate?: (date: Date) => void,
    onCancel?: () => Promise<boolean>,
    renderDate?: ((dateToRender: Date | null, referenceDate: Date | null, emptyRow: boolean) => any) | undefined,
    accessibilityLabel?: string,
    children?: React.ReactNode
}
export const SimpleDatePicker: FunctionComponent<SimpleDatePickerProps> = (props) => {

    const selectDateTranslation = useTranslation(TranslationKeys.selectDate);
    const yearTranslation = useTranslation(TranslationKeys.year);
    const monthTranslation = useTranslation(TranslationKeys.month);
    const selectedTranslation = useTranslation(TranslationKeys.selected);

    const currentDateFromProps = props?.currentDate;
    const currentDate = currentDateFromProps ? new Date(currentDateFromProps) : new Date(); // make a copy if currentDateFromProps is a hookValue and to remove side effects
    const formatedSelectedDate = DateHelper.formatOfferDateToReadable(new Date(currentDate), true);
    const accessibilityLabel = props?.accessibilityLabel || formatedSelectedDate;

    const locale = useProfileLocaleForJsDate();

    const selectedDateColor = useProjectColor();
    const selectedTextColor = useProjectColorContrast();

    const weekdayBackgroundColor = useProjectColor();
    const weekdayTextColor = useProjectColorContrast();

    let items: MyGlobalActionSheetItem[] = [];

    items.push({
        key: "gridList",
        label: selectDateTranslation,
        //icon: "test",
        accessibilityLabel: selectDateTranslation,
        render: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
            console.log("render" + formatedSelectedDate)

            // Use the custom context provider to provide the input value and setter
            const onSelectDate = (date: Date) => {
                if(props.onSelectDate){
                    props.onSelectDate(date);
                }
                hide();
            }

            return <SimpleDatePickerComponent
                currentDate={props.currentDate}
                selectedTextColor={selectedTextColor}
                selectedDateColor={selectedDateColor}
                weekdayBackgroundColor={weekdayBackgroundColor}
                weekdayTextColor={weekdayTextColor}
                onSelectDate={onSelectDate}
                renderDate={props.renderDate}
                locale={locale}
                yearTranslation={yearTranslation}
                monthTranslation={monthTranslation}
                selectedTranslation={selectedTranslation}
            />
        }
    })

    const config = {
        onCancel: async () => {
            if(props.onCancel){
                return await props.onCancel();
            }
            return true;
        },
        visible: true,
        title: selectDateTranslation,
        items: items
    }

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show(config)
    }

    return(
        <MyButton useTransparentBorderColor={true} tooltip={accessibilityLabel} useOnlyNecessarySpace={true} leftIcon={IconNames.calendar_icon} accessibilityLabel={accessibilityLabel} onPress={onPress} />
    )
}
