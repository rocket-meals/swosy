import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {Weekday} from "@/helper/date/DateHelper";
import {PriceGroups, useProfilePriceGroup} from "@/states/SynchedProfile";
import {MyGlobalActionSheetConfig} from "@/components/actionsheet/MyGlobalActionSheet";
import {View} from "@/components/Themed";
import {MoneyConfident} from "@/compositions/animations/accountBalance/MoneyConfident";

export type AvailableOption = {
    value: string | null | undefined | Weekday
    name: string,
    icon?: string,
}

interface AppState {

}
export const SettingsRowPriceGroup: FunctionComponent<AppState> = ({...props}) => {

    let usedIconName: string = IconNames.price_group_icon

    const [priceGroup, setPriceGroup] = useProfilePriceGroup();

    const title = useTranslation(TranslationKeys.price_group)

    const translation_select = useTranslation(TranslationKeys.select)

    const translation_edit = useTranslation(TranslationKeys.edit)

    const translation_price_group_student = useTranslation(TranslationKeys.price_group_student)
    const translation_price_group_employee = useTranslation(TranslationKeys.price_group_employee)
    const translation_price_group_guest = useTranslation(TranslationKeys.price_group_guest)

    const priceGroupToName: {[key in PriceGroups]: string}
        = {
        [PriceGroups.Student]: translation_price_group_student,
        [PriceGroups.Employee]: translation_price_group_employee,
        [PriceGroups.Guest]: translation_price_group_guest,
    }

    const priceGroupToIcon: {[key in PriceGroups]: string}
        = {
        [PriceGroups.Student]: IconNames.price_group_student,
        [PriceGroups.Employee]: IconNames.price_group_employee,
        [PriceGroups.Guest]: IconNames.price_group_guest,
    }

    let availableOptions: { [key: string]: AvailableOption } = {
    }

    let availablePriceGroupKeys = Object.keys(priceGroupToName);
    for(let i=0; i<availablePriceGroupKeys.length; i++){
        let availablePriceGroupKey = availablePriceGroupKeys[i] as PriceGroups
        let name = priceGroupToName[availablePriceGroupKey];
        let icon = priceGroupToIcon[availablePriceGroupKey];
        availableOptions[availablePriceGroupKey] = {
            value: availablePriceGroupKey as PriceGroups,
            name: name,
            icon: icon
        }
    }

    let items = []

    let selectedOptionName = priceGroupToName[priceGroup]
    let availableOptionKeys: string[] = Object.keys(availableOptions);
    for(let i=0; i<availableOptionKeys.length; i++){
        let optionKey: string = availableOptionKeys[i];
        let option = availableOptions[optionKey];
        let active = priceGroup === option.value
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
                setPriceGroup(value as PriceGroups)
            }
        })
    }

    const accessibilityLabel = translation_edit+": "+title + " " + selectedOptionName
    const label = title

    function renderPriceAnimation(){
        return <View style={{
            width: "100%",
        }}>
            <MoneyConfident />
        </View>
    }

    const config: MyGlobalActionSheetConfig = {
        onCancel: undefined,
        visible: true,
        title: title,
        renderPreItemsContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
            return renderPriceAnimation()
        },
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
