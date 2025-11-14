import { Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const TriStateCheckbox = ({
	id,
	value,
	onChange,
	isDisabled,
	custom_type,
}: {
	id: string;
	value?: number | null | undefined; // 0: false, 1: true, null/undefined: No value
	onChange: (id: string, value?: number | null | undefined, custom_type?: string) => void;
	isDisabled?: boolean;
	custom_type?: string;
}) => {
	const { theme } = useTheme();
	const { primaryColor } = useSelector((state: RootState) => state.settings);

	// Normalize legacy `2` to null as previously indeterminate was 2
	const currentValue: number | null | undefined = value === 2 ? null : value;

	// Order: Ja (true=1), Nein (false=0), Undefiniert (null)
	const options: Array<{ key: string; val: number | null; label: string }> = [
		{ key: 'yes', val: 1, label: 'Ja' },
		{ key: 'no', val: 0, label: 'Nein' },
		{ key: 'undef', val: null, label: 'Undefiniert' },
	];

	const handlePress = (optionVal: number | null) => {
		const isSelected = optionVal === null ? currentValue === null : currentValue === optionVal;
		if (isSelected) {
			onChange(id, undefined, custom_type ?? '');
		} else {
			onChange(id, optionVal, custom_type ?? '');
		}
	};

	return (
		<View style={{ ...styles.container }}>
			<View style={{ ...styles.optionsRow }}>
				{options.map(option => {
					const isSelected = option.val === null ? currentValue === null : currentValue === option.val;
					return (
						<TouchableOpacity key={option.key} style={{ ...styles.optionContainer, backgroundColor: isSelected ? primaryColor : theme.screen.iconBg }} onPress={() => !isDisabled && handlePress(option.val)} disabled={isDisabled}>
							<View style={styles.optionBox}>
								<MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={22} color={isSelected ? theme.activeText : theme.screen.icon} />
							</View>
							<Text style={{ ...styles.optionLabel, color: isSelected ? theme.activeText : theme.screen.text }}>{option.label}</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
};

export default TriStateCheckbox;
