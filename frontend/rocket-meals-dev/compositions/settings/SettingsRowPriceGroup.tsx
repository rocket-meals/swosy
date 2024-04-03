import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {Weekday} from '@/helper/date/DateHelper';
import {PriceGroups, useProfilePriceGroup} from '@/states/SynchedProfile';
import {View} from '@/components/Themed';
import {AnimationPriceGroup} from "@/compositions/animations/AnimationPriceGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";

export type AvailableOption = {
    value: string | null | undefined | Weekday
    name: string,
    icon?: string,
}

export function usePriceGroupSelectedName(){
	const [priceGroup, setPriceGroup] = useProfilePriceGroup();

	const translation_price_group_student = useTranslation(TranslationKeys.price_group_student)
	const translation_price_group_employee = useTranslation(TranslationKeys.price_group_employee)
	const translation_price_group_guest = useTranslation(TranslationKeys.price_group_guest)

	const priceGroupToName: {[key in PriceGroups]: string}
		= {
		[PriceGroups.Student]: translation_price_group_student,
		[PriceGroups.Employee]: translation_price_group_employee,
		[PriceGroups.Guest]: translation_price_group_guest,
	}

	let selectedOptionName = priceGroupToName[priceGroup]

	return selectedOptionName;
}

export const useShowPriceGroupModal = () => {
	const usedIconName: string = IconNames.price_group_icon
	const [modalConfig, setModalConfig] = useModalGlobalContext();

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

	const availableOptions: { [key: string]: AvailableOption } = {
	}

	const availablePriceGroupKeys = Object.keys(priceGroupToName);
	for (let i=0; i<availablePriceGroupKeys.length; i++) {
		const availablePriceGroupKey = availablePriceGroupKeys[i] as PriceGroups
		const name = priceGroupToName[availablePriceGroupKey];
		const icon = priceGroupToIcon[availablePriceGroupKey];
		availableOptions[availablePriceGroupKey] = {
			value: availablePriceGroupKey as PriceGroups,
			name: name,
			icon: icon
		}
	}

	const items: MyModalActionSheetItem[] = []

	let selectedOptionName = priceGroupToName[priceGroup]
	const availableOptionKeys: string[] = Object.keys(availableOptions);
	for (let i=0; i<availableOptionKeys.length; i++) {
		const optionKey: string = availableOptionKeys[i];
		const option = availableOptions[optionKey];
		const active = priceGroup === option.value
		if (active) {
			selectedOptionName = option.name;
		}

		const icon = option.icon
		const itemAccessibilityLabel = translation_select+': '+option.name

		items.push({
			key: optionKey,
			label: option.name,
			iconLeft: icon,
			active: active,
			accessibilityLabel: itemAccessibilityLabel,
			onSelect: async (value: string, hide: () => void) => {
				await setPriceGroup(value as PriceGroups)
				hide()
			}
		})
	}


	function renderPriceAnimation() {
		return (
			<View style={{
				width: '100%',
				justifyContent: 'center',
				alignItems: 'center',
			}}
			>
				<AnimationPriceGroup />
			</View>
		)
	}

	const onPress = () => {
		setModalConfig({
			key: "price_group",
			title: title,
			label: translation_edit+' '+title,
			accessibilityLabel: translation_edit+' '+title,
			renderAsContentPreItems: (key, hide) => {
				return renderPriceAnimation()
			},
			items: items,
		})
	}

	return onPress
}

interface AppState {

}
export const SettingsRowPriceGroup: FunctionComponent<AppState> = ({...props}) => {
	const usedIconName: string = IconNames.price_group_icon

	const [priceGroup, setPriceGroup] = useProfilePriceGroup();
	const showPriceGroupModal = useShowPriceGroupModal();

	const title = useTranslation(TranslationKeys.price_group)

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

	let selectedOptionName = priceGroupToName[priceGroup]

	const accessibilityLabel = translation_edit+': '+title + ' ' + selectedOptionName
	const label = title


	const labelRight = selectedOptionName

	const onPress = showPriceGroupModal


	return (
		<>
			<SettingsRow labelLeft={label} labelRight={labelRight} onPress={onPress} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={usedIconName} {...props}  />
		</>

	)
}
