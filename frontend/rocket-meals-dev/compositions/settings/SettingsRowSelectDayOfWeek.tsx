import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {useSynchedFirstWeekday} from "@/states/SynchedFirstWeekday";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {View, Text} from "@/components/Themed";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";

export type AvailableOption = {
    value: string | null | undefined | Weekday
    name: string,
    icon?: string,
}

interface AppState {
    title?: string,
    icon?: string,
    onSelect: (option: AvailableOption, hide: () => void) => void,
    selectedValue: string | null | undefined
    additionalOptions?: { [key: string]: AvailableOption }
}
export const SettingsRowSelectDayOfWeek: FunctionComponent<AppState> = ({...props}) => {

    let usedIconName: string = IconNames.first_weekday_icon
    if(props.icon){
        usedIconName = props.icon;
    }

    const default_title = useTranslation(TranslationKeys.weekday)
    const title = props.title || default_title

    const translation_select = useTranslation(TranslationKeys.select)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const additionalOptions = props.additionalOptions || {}

    const selectedValue = props.selectedValue;
    const locale = useProfileLocaleForJsDate()

    const first_day_of_week_system_value = null;

    const weekDayKeyToName: {[key in Weekday]: string}
        = {
        [Weekday.SUNDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.SUNDAY, locale),
        [Weekday.MONDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.MONDAY, locale),
        [Weekday.TUESDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.TUESDAY, locale),
        [Weekday.WEDNESDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.WEDNESDAY, locale),
        [Weekday.THURSDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.THURSDAY, locale),
        [Weekday.FRIDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.FRIDAY, locale),
        [Weekday.SATURDAY]: DateHelper.getWeekdayTranslationByWeekday(Weekday.SATURDAY, locale),
    }

    let availableOptions: { [key: string]: AvailableOption } = {
    }

    let availableWeekdayKeys = Object.keys(weekDayKeyToName);
    for(let i=0; i<availableWeekdayKeys.length; i++){
        let availableWeekdayKey = availableWeekdayKeys[i] as Weekday
        let name = weekDayKeyToName[availableWeekdayKey];
        availableOptions[availableWeekdayKey] = {
            value: availableWeekdayKey as Weekday,
            name: name
        }
    }

    let additionalOptionKeys = Object.keys(additionalOptions);
    for(let i=0; i<additionalOptionKeys.length; i++){
        let additionalOptionKey = additionalOptionKeys[i];
        let additionalOption = additionalOptions[additionalOptionKey];
        availableOptions[additionalOptionKey] = {
            value: additionalOption.value,
            name: additionalOption.name,
            icon: additionalOption.icon
        }
    }

    let items = []

    let selectedOptionName = "undefined";
    let availableOptionKeys: string[] = Object.keys(availableOptions);
    for(let i=0; i<availableOptionKeys.length; i++){
        let optionKey: string = availableOptionKeys[i];
        let option = availableOptions[optionKey];
        let active = selectedValue === option.value
        if(active){
            selectedOptionName = option.name;
        }

        let icon = option.icon
        let itemAccessibilityLabel = translation_select+": "+option.name

        items.push({
            key: optionKey,
            label: option.name,
            icon: icon,
            active: active,
            accessibilityLabel: itemAccessibilityLabel,
            onSelect: (value: string, hide: () => void) => {
                props.onSelect(option, hide);
            }
        })
    }

    const accessibilityLabel = translation_edit+": "+title + " " + selectedOptionName
    const label = title

    const config = {
        onCancel: undefined,
        visible: true,
        title: title,
        items: items
    }

    function renderDebug(){
        return null
    }

    let labelRight = selectedOptionName


    return(
        <>
            <SettingsRowActionsheet labelLeft={label} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={usedIconName} {...props}  />
            {renderDebug()}
        </>
    )
}
