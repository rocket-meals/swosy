import React from 'react';
import SettingsListSelectOptionSingle from '../SettingsListSelectOptionSingle/SettingsListSelectOptionSingle';
import type { SettingsListSelectableItemBase } from '../SettingsList/types';

export type SettingsListSelectOptionItem<T> = SettingsListSelectableItemBase<T> & {
	nativeID?: string;
};

export type SettingsListSelectOptionProps<T extends string | number> = {
	options: SettingsListSelectOptionItem<T>[];
	selectedOption: T | null;
	onSelect: (option: SettingsListSelectOptionItem<T>) => void;
	iconBgColor?: string;
	selectionColor?: string;
	noIconIndent?: boolean;
};

const SettingsListSelectOption = <T extends string | number>({
	options,
	selectedOption,
	onSelect,
	iconBgColor,
	selectionColor,
	noIconIndent = false,
}: SettingsListSelectOptionProps<T>) => {
	return (
		<>
			{options.map((option, index) => {
				let groupPosition: 'single' | 'top' | 'bottom' | 'middle';
				if (options.length === 1) {
					groupPosition = 'single';
				} else if (index === 0) {
					groupPosition = 'top';
				} else if (index === options.length - 1) {
					groupPosition = 'bottom';
				} else {
					groupPosition = 'middle';
				}

				return (
					<SettingsListSelectOptionSingle
						key={String(option.id)}
						label={option.label}
						leftIcon={option.icon}
						iconBgColor={iconBgColor}
						selectionColor={selectionColor}
						isSelected={selectedOption === option.id}
						groupPosition={groupPosition}
						showSeparator={index !== options.length - 1}
						noIconIndent={noIconIndent}
						onPress={() => onSelect(option)}
						nativeID={option.nativeID}
					/>
				);
			})}
		</>
	);
};

export default SettingsListSelectOption;
