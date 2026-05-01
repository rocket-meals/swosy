// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsList from '@/components/SettingsList';
import { useTheme } from '@/hooks/useTheme';

export type SettingsListSelectOptionItem<T> = {
	id: T;
	label: string;
	icon?: React.ReactNode;
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
	const { theme } = useTheme();
	const resolvedSelectionColor = selectionColor ?? iconBgColor;

	return (
		<>
			{options.map((option, index) => {
				const groupPosition =
					options.length === 1
						? 'single'
						: index === 0
							? 'top'
							: index === options.length - 1
								? 'bottom'
								: 'middle';

				const isSelected = selectedOption === option.id;

				return (
					<SettingsList
						key={String(option.id)}
						label={option.label}
						leftIcon={option.icon}
						iconBgColor={iconBgColor}
						groupPosition={groupPosition}
						showSeparator={index !== options.length - 1}
						noIconIndent={noIconIndent}
						rightIcon={
							<MaterialCommunityIcons
								name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
								size={24}
								color={isSelected ? resolvedSelectionColor : theme.screen.icon}
							/>
						}
						handleFunction={() => onSelect(option)}
					/>
				);
			})}
		</>
	);
};

export default SettingsListSelectOption;

