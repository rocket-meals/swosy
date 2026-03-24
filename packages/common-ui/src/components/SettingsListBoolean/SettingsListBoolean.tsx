import React from 'react';
import { Switch } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../context/ThemeContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';

type SettingsListBooleanPropsOwn = {
	isEnabled: boolean;
	onToggle: () => void;
	disabled?: boolean;
	valueActive?: string;
	valueInactive?: string;
};

export type SettingsListBooleanProps = PropsWithChildren<
	Omit<SettingsListProps, 'rightElement' | 'rightIcon' | 'onPress' | 'handleFunction' | 'value'> &
		SettingsListBooleanPropsOwn
>;

const SettingsListBoolean: React.FC<SettingsListBooleanProps> = ({
	isEnabled,
	onToggle,
	disabled = false,
	valueActive = 'Active',
	valueInactive = 'Inactive',
	isAccountRequired,
	primaryColor,
	...props
}) => {
	const { theme } = useTheme();
	const isDisabled = disabled || !!isAccountRequired;
	const resolvedPrimaryColor = primaryColor ?? theme.primary;

	return (
		<SettingsList
			{...props}
			primaryColor={resolvedPrimaryColor}
			isAccountRequired={isAccountRequired}
			value={isEnabled ? valueActive : valueInactive}
			rightElement={
				<Switch
					value={isEnabled}
					onValueChange={isDisabled ? undefined : onToggle}
					trackColor={{ false: theme.screen.iconBg, true: resolvedPrimaryColor }}
					thumbColor={theme.screen.icon}
					ios_backgroundColor={theme.screen.iconBg}
					disabled={isDisabled}
				/>
			}
			handleFunction={isDisabled ? undefined : onToggle}
		/>
	);
};

export default SettingsListBoolean;
