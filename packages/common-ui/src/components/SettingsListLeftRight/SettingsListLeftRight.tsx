import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SettingsList from '../SettingsList';
import type { SettingsListItemBaseProps, SettingsListProps } from '../SettingsList/types';

export type SettingsListLeftRightItem<T> = {
	id: T;
	label: string;
	icon?: React.ReactNode;
};

export type SettingsListLeftRightProps<T extends string | number> = Pick<
	SettingsListItemBaseProps,
	'leftIcon' | 'iconBgColor' | 'showSeparator' | 'noIconIndent'
> & {
	label?: string;
	options: SettingsListLeftRightItem<T>[];
	selectedOption: T | null;
	onSelect: (option: SettingsListLeftRightItem<T>) => void;
	groupPosition?: SettingsListProps['groupPosition'];
	accentColor?: string;
	onPress?: () => void;
	/** Optional element rendered between the value text and the right arrow. */
	extraRightElement?: React.ReactNode;
};

const SettingsListLeftRight = <T extends string | number>({
	label,
	options,
	selectedOption,
	onSelect,
	leftIcon,
	iconBgColor,
	showSeparator,
	noIconIndent = false,
	groupPosition = 'single',
	onPress,
	extraRightElement,
}: SettingsListLeftRightProps<T>) => {
	const { theme } = useTheme();

	const currentIndex = options.findIndex((o) => o.id === selectedOption);

	const handlePrevious = () => {
		if (options.length === 0) return;
		const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
		onSelect(options[prevIndex]);
	};

	const handleNext = () => {
		if (options.length === 0) return;
		const nextIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1;
		onSelect(options[nextIndex]);
	};

	const currentOption = currentIndex >= 0 ? options[currentIndex] : null;
	const displayValue = currentOption?.label ?? '';

	const leftArrow = (
		<TouchableOpacity
			onPress={handlePrevious}
			style={styles.arrowButton}
			hitSlop={8}
			accessibilityRole="button"
			accessibilityLabel="Previous option"
		>
			<MaterialCommunityIcons
				name="chevron-left"
				size={28}
				color={theme.screen.text}
			/>
		</TouchableOpacity>
	);

	const rightArrow = (
		<TouchableOpacity
			onPress={handleNext}
			style={styles.arrowButton}
			hitSlop={8}
			accessibilityRole="button"
			accessibilityLabel="Next option"
		>
			<MaterialCommunityIcons
				name="chevron-right"
				size={28}
				color={theme.screen.text}
			/>
		</TouchableOpacity>
	);

	return (
		<SettingsList
			label={label}
			value={displayValue}
			leftIcon={leftIcon}
			leftIconComponent={!leftIcon ? leftArrow : undefined}
			iconBgColor={iconBgColor}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			noIconIndent={noIconIndent}
			onPress={onPress}
			rightElement={
				extraRightElement ? (
					<View style={styles.rightContainer}>
						{extraRightElement}
						{rightArrow}
					</View>
				) : (
					rightArrow
				)
			}
		/>
	);
};

export default SettingsListLeftRight;

const styles = StyleSheet.create({
	arrowButton: {
		padding: 2,
	},
	rightContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
});
