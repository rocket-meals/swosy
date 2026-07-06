import React from 'react';
import { StyleSheet, View } from 'react-native';
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
	nativeID?: string;
	/** Optional content rendered to the left of the radio button. */
	extraRightContent?: React.ReactNode;
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
	nativeID,
	extraRightContent,
}) => {
	const { theme } = useTheme();
	const resolvedSelectionColor = selectionColor ?? iconBgColor;

	const radioButton = (
		<MaterialCommunityIcons
			name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
			size={24}
			color={isSelected ? resolvedSelectionColor : theme.screen.icon}
		/>
	);

	return (
		<SettingsList
			label={label}
			leftIcon={leftIcon}
			iconBgColor={iconBgColor}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			noIconIndent={noIconIndent}
			nativeID={nativeID}
			rightElement={
				extraRightContent ? (
					<View style={styles.rightRow}>
						{extraRightContent}
						{radioButton}
					</View>
				) : undefined
			}
			rightIcon={!extraRightContent ? radioButton : undefined}
			handleFunction={onPress}
		/>
	);
};

export default SettingsListSelectOptionSingle;

const styles = StyleSheet.create({
	rightRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
});
