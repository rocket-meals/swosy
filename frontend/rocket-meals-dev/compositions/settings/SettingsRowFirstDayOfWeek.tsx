import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {useSynchedFirstWeekday} from "@/states/SynchedFirstWeekday";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {View, Text} from "@/components/Themed";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";

interface AppState {

}
export const SettingsRowFirstDayOfWeek: FunctionComponent<AppState> = ({...props}) => {

    const colorSchemeIconName = IconNames.first_weekday_icon

    const title = useTranslation(TranslationKeys.first_day_of_week)

    const translation_first_day_of_week_system = useTranslation(TranslationKeys.first_day_of_week_system)
    const translation_select = useTranslation(TranslationKeys.select)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const [firstDayOfWeek, setFirstDayOfWeekRaw, firstDayOfWeekRaw] = useSynchedFirstWeekday();
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

    let selectedName = translation_first_day_of_week_system
    if(firstDayOfWeekRaw !== first_day_of_week_system_value){
        selectedName = weekDayKeyToName[firstDayOfWeekRaw]
    }

    const accessibilityLabel = translation_edit+": "+title + " " + selectedName
    const label = title

    let items = []
    let availableWeekdayKeys: (Weekday | null)[] = Object.keys(weekDayKeyToName) as (Weekday | null)[]
    availableWeekdayKeys.push(first_day_of_week_system_value); // add the system option
    for(let key of availableWeekdayKeys){
        let label: string = translation_first_day_of_week_system
        if(key !== first_day_of_week_system_value){
            label = weekDayKeyToName[key]
        }
        let active = key === firstDayOfWeekRaw

        let icon = IconNames.chevron_right_icon
        if(key === first_day_of_week_system_value){
            icon = IconNames.first_weekday_system_icon
        }

        let itemAccessibilityLabel = label+" "+translation_select

        items.push({
            key: key as string,
            label: label,
            icon: icon,
            active: active,
            accessibilityLabel: itemAccessibilityLabel,
            onSelect: async (key: string) => {
                let nextColorSchemeKey: Weekday | null = key as Weekday | null
                setFirstDayOfWeekRaw(nextColorSchemeKey)
                return true // close the actionsheet
            }
        })
    }

    const config = {
        onCancel: undefined,
        visible: true,
        title: title,
        items: items
    }

    function renderDebug(){
        return null
    }

    let labelRight = selectedName


    return(
        <>
            <SettingsRowActionsheet labelLeft={label} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={colorSchemeIconName} {...props}  />
            {renderDebug()}
        </>
    )
}
