import React, {FunctionComponent} from 'react';
import {SettingsRowActionsheet} from '@/components/settings/SettingsRowActionsheet';
import {useIsDebug} from '@/states/Debug';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {DisplaySettingsValueRanges, useSynchedDisplaySettings} from "@/states/SynchedDisplaySettings";

interface AppState {

}
export const SettingsRowAmountColumns: FunctionComponent<AppState> = ({...props}) => {
	const leftIcon = IconNames.amount_columns_icon

	const title = useTranslation(TranslationKeys.amount_columns_for_cards)
	const translation_automatic = useTranslation(TranslationKeys.automatic);

	const KEY_OPTION_SYSTEM = "system"

	const availableOptionKeys: (string | number)[] = [KEY_OPTION_SYSTEM]
	for(let i=DisplaySettingsValueRanges.AMOUNT_COLUMNS_MIN; i<=DisplaySettingsValueRanges.AMOUNT_COLUMNS_MAX; i++){
		availableOptionKeys.push(i);
	}

	const [displaySettings, setDisplaySettings] = useSynchedDisplaySettings();
	const savedOptionKey = displaySettings.amountColumns;
	const selectedKey = savedOptionKey;

	function isSavedValueTheSystemOption(savedOptionkey: number | null | undefined): boolean {
		return savedOptionkey === undefined || savedOptionkey === null
	}

	function isKeyOptionSystem(key: string | number): boolean {
		return key === KEY_OPTION_SYSTEM
	}

	// @ts-ignore
	const selectedKeyName = isSavedValueTheSystemOption(savedOptionKey) ? translation_automatic : savedOptionKey.toString()
	const isDebug = useIsDebug()

	const translation_select = useTranslation(TranslationKeys.select)

	const translation_edit = useTranslation(TranslationKeys.edit)

	const accessibilityLabel = translation_edit+': '+title
	const label = title

	const items: MyModalActionSheetItem[] = []
	for (const key of availableOptionKeys) {
		const isKeySystem = isKeyOptionSystem(key)
		const label: string = isKeySystem ? translation_automatic : key.toString()

		const icon = isKeySystem ? IconNames.settings_system_auto_icon : undefined
		let active = key === selectedKey

		const itemAccessibilityLabel = label+' '+translation_select

		items.push({
			key: key.toString(),
			label: label,
			iconLeft: icon,
			active: active,
			accessibilityLabel: itemAccessibilityLabel,
			onSelect: async (key: string, hide: () => void) => {
				const nextValue = isKeyOptionSystem(key) ? undefined : parseInt(key)
				setDisplaySettings((currentValue) => {
					return {
						...currentValue,
						amountColumns: nextValue
					}
				})
				hide()
			}
		})
	}

	const config: MyModalActionSheetItem = {
		accessibilityLabel: accessibilityLabel,
		key: 'drawer_position',
		label: title,
		title: title,
		items: items
	}

	return (
		<>
			<SettingsRowActionsheet labelRight={selectedKeyName} rightIcon={IconNames.edit_icon} labelLeft={label} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={leftIcon} {...props}  />
		</>
	)
}
