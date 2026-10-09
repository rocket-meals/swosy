import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Switch, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';

type SettingsListBooleanPropsOwn = {
	isEnabled: boolean;
	onToggle: () => void;
	disabled?: boolean;
	/** Shows a spinner next to the switch and blocks it while a change is still being saved. */
	loading?: boolean;
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
	loading = false,
	valueActive = 'Active',
	valueInactive = 'Inactive',
	isAccountRequired,
	primaryColor,
	...props
}) => {
	const { theme } = useTheme();
	const settingsCtx = useSettingsContext();
	const isDisabled = disabled || loading || !!isAccountRequired;
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? theme.primary;

	return (
		<SettingsList
			{...props}
			primaryColor={resolvedPrimaryColor}
			isAccountRequired={isAccountRequired}
			value={isEnabled ? valueActive : valueInactive}
			rightElement={
				<View style={styles.rightElement}>
					{loading ? <ActivityIndicator size="small" color={theme.screen.icon} /> : null}
					<Switch
						value={isEnabled}
						// On web the Switch click bubbles up to the parent TouchableOpacity,
						// which already calls onToggle via handleFunction. Suppress onValueChange
						// on web to avoid a double invocation.
						onValueChange={isDisabled || Platform.OS === 'web' ? undefined : onToggle}
						trackColor={{ false: theme.screen.iconBg, true: resolvedPrimaryColor }}
						thumbColor={theme.screen.icon}
						ios_backgroundColor={theme.screen.iconBg}
						disabled={isDisabled}
						accessibilityLabel={props.title ?? props.label}
						accessibilityState={{ disabled: isDisabled, busy: loading }}
					/>
				</View>
			}
			handleFunction={isDisabled ? undefined : onToggle}
		/>
	);
};

const styles = StyleSheet.create({
	rightElement: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
});

export default SettingsListBoolean;
