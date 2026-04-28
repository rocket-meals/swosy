import React from 'react';
import { Switch, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
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
	const settingsCtx = useSettingsContext();
	const isDisabled = disabled || !!isAccountRequired;
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? theme.primary;

	return (
		<SettingsList
			{...props}
			primaryColor={resolvedPrimaryColor}
			isAccountRequired={isAccountRequired}
			value={isEnabled ? valueActive : valueInactive}
			rightElement={
				// Wrap the Switch in a View that stops click-event propagation on web.
				// Without this, React Native Web bubbles the click from the Switch up to
				// the parent TouchableOpacity, causing onToggle to fire twice when the
				// slider is tapped.
				<View
					// @ts-expect-error – onClick is a valid DOM prop in React Native Web
					onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
				>
					<Switch
						value={isEnabled}
						onValueChange={isDisabled ? undefined : onToggle}
						trackColor={{ false: theme.screen.iconBg, true: resolvedPrimaryColor }}
						thumbColor={theme.screen.icon}
						ios_backgroundColor={theme.screen.iconBg}
						disabled={isDisabled}
					/>
				</View>
			}
			handleFunction={isDisabled ? undefined : onToggle}
		/>
	);
};

export default SettingsListBoolean;
