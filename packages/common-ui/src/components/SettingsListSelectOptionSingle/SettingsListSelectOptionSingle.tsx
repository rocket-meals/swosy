import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SettingsList from '../SettingsList';
import type { SettingsListItemBaseProps, SettingsListProps } from '../SettingsList/types';

export type SettingsListSelectOptionSingleProps = Pick<
	SettingsListItemBaseProps,
	'leftIcon' | 'iconBgColor' | 'showSeparator' | 'noIconIndent'
> & {
	label: string;
	onPress: () => void;
	selectionColor?: string;
	isSelected: boolean;
	groupPosition?: SettingsListProps['groupPosition'];
};

const SettingsListSelectOptionSingle: React.FC<SettingsListSelectOptionSingleProps> = ({
	label,
	leftIcon,
	iconBgColor,
	selectionColor,
	isSelected,
	onPress,
	groupPosition,
	showSeparator = true,
	noIconIndent = false,
}) => {
	const { theme } = useTheme();
	const resolvedSelectionColor = selectionColor ?? iconBgColor;

	return (
		<SettingsList
			label={label}
			leftIcon={leftIcon}
			iconBgColor={iconBgColor}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			noIconIndent={noIconIndent}
			rightIcon={
				<MaterialCommunityIcons
					name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
					size={24}
					color={isSelected ? resolvedSelectionColor : theme.screen.icon}
				/>
			}
			handleFunction={onPress}
		/>
	);
};

export default SettingsListSelectOptionSingle;
