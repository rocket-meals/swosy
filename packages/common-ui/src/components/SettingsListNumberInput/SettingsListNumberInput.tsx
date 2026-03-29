import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';
import { borderRadiusContainer } from '../../constants/ui';

export interface SettingsListNumberInputProps extends Omit<SettingsListProps, 'onPress' | 'handleFunction'> {
	modalTitle?: string;
	placeholder?: string;
	saveLabel?: string;
	onSave: (value: number) => void | Promise<void>;
	initialValue?: number;
	min?: number;
	max?: number;
	step?: number;
	suffix?: string;
	prefix?: string;
	/** Allow decimal input */
	allowDecimal?: boolean;
}

type ModalSheetProps = {
	initialValue: number;
	placeholder: string;
	saveLabel: string;
	onSave: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	suffix?: string;
	prefix?: string;
	allowDecimal?: boolean;
	primaryColor: string;
};

function clamp(value: number, min?: number, max?: number): number {
	if (min != null && value < min) return min;
	if (max != null && value > max) return max;
	return value;
}

const ModalSheet: React.FC<ModalSheetProps> = ({
	initialValue,
	placeholder,
	saveLabel,
	onSave,
	min,
	max,
	step = 1,
	suffix,
	prefix,
	allowDecimal = false,
	primaryColor,
}) => {
	const { theme } = useTheme();
	const [textValue, setTextValue] = useState(String(initialValue));

	useEffect(() => {
		setTextValue(String(initialValue));
	}, [initialValue]);

	const numericValue = useMemo(() => {
		const parsed = allowDecimal ? parseFloat(textValue) : parseInt(textValue, 10);
		return isNaN(parsed) ? initialValue : parsed;
	}, [textValue, allowDecimal, initialValue]);

	const isValid = !isNaN(numericValue) && (min == null || numericValue >= min) && (max == null || numericValue <= max);
	const hasChanges = numericValue !== initialValue;
	const disableSave = !isValid || !hasChanges;

	const handleStep = useCallback(
		(delta: number) => {
			const next = clamp(Math.round((numericValue + delta) * 100) / 100, min, max);
			setTextValue(String(next));
		},
		[numericValue, min, max],
	);

	const handleSave = useCallback(() => {
		if (!isValid) return;
		Keyboard.dismiss();
		onSave(clamp(numericValue, min, max));
	}, [isValid, numericValue, min, max, onSave]);

	const content = (
		<View style={styles.sheetView}>
			<View style={styles.inputRow}>
				<TouchableOpacity
					style={[styles.stepButton, { backgroundColor: primaryColor + '20' }]}
					onPress={() => handleStep(-step)}
				>
					<Ionicons name="remove" size={20} color={primaryColor} />
				</TouchableOpacity>
				<View style={styles.inputContainer}>
					{prefix ? <Text style={[styles.affix, { color: theme.sheet.text }]}>{prefix}</Text> : null}
					<TextInput
						style={[
							styles.sheetInput,
							{
								color: theme.sheet.text,
								backgroundColor: theme.sheet.inputBg,
								borderColor: isValid ? theme.sheet.inputBorder : '#dc2626',
								borderRadius: borderRadiusContainer,
							},
						]}
						autoFocus
						placeholder={placeholder}
						placeholderTextColor={theme.sheet.placeholder}
						selectionColor={primaryColor}
						value={textValue}
						onChangeText={setTextValue}
						keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
						blurOnSubmit
						returnKeyType="done"
						onSubmitEditing={handleSave}
					/>
					{suffix ? <Text style={[styles.affix, { color: theme.sheet.text }]}>{suffix}</Text> : null}
				</View>
				<TouchableOpacity
					style={[styles.stepButton, { backgroundColor: primaryColor + '20' }]}
					onPress={() => handleStep(step)}
				>
					<Ionicons name="add" size={20} color={primaryColor} />
				</TouchableOpacity>
			</View>
			{min != null || max != null ? (
				<Text style={[styles.rangeHint, { color: theme.sheet.placeholder }]}>
					{min != null && max != null
						? `${min} – ${max}`
						: min != null
						? `Min: ${min}`
						: `Max: ${max}`}
				</Text>
			) : null}
			<TouchableOpacity
				style={[styles.saveButton, { backgroundColor: primaryColor, opacity: disableSave ? 0.5 : 1 }]}
				onPress={handleSave}
				activeOpacity={0.8}
				disabled={disableSave}
			>
				<Text style={[styles.saveButtonText, { color: '#ffffff' }]}>{saveLabel}</Text>
			</TouchableOpacity>
		</View>
	);

	if (Platform.OS === 'web') return content;

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'position' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
			style={styles.keyboardAvoidingView}
		>
			<View style={styles.keyboardAvoidingContent}>{content}</View>
		</KeyboardAvoidingView>
	);
};

const SettingsListNumberInput: React.FC<SettingsListNumberInputProps> = ({
	modalTitle,
	placeholder = '0',
	saveLabel = 'Save',
	onSave,
	initialValue = 0,
	min,
	max,
	step,
	suffix,
	prefix,
	allowDecimal,
	rightElement,
	rightIcon,
	value,
	label,
	title,
	primaryColor,
	...props
}) => {
	const { theme } = useTheme();
	const { show, close } = useMyScrollViewModal();
	const settingsCtx = useSettingsContext();
	const resolvedTitle = useMemo(() => modalTitle ?? title ?? label ?? '', [label, modalTitle, title]);
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? theme.primary;

	const resolvedRightIcon = useMemo(
		() =>
			rightIcon ? (
				rightIcon
			) : rightElement ? (
				undefined
			) : (
				<MaterialCommunityIcons name="pencil" size={20} color={theme.screen.icon} />
			),
		[rightElement, rightIcon, theme.screen.icon],
	);

	const handleOpen = useCallback(() => {
		show({
			title: resolvedTitle,
			onClose: close,
			children: (
				<ModalSheet
					initialValue={initialValue}
					placeholder={placeholder}
					saveLabel={saveLabel}
					onSave={async (val) => {
						await onSave(val);
						close();
					}}
					min={min}
					max={max}
					step={step}
					suffix={suffix}
					prefix={prefix}
					allowDecimal={allowDecimal}
					primaryColor={resolvedPrimaryColor}
				/>
			),
		});
	}, [
		allowDecimal,
		close,
		initialValue,
		max,
		min,
		onSave,
		placeholder,
		prefix,
		resolvedPrimaryColor,
		resolvedTitle,
		saveLabel,
		show,
		step,
		suffix,
	]);

	return (
		<SettingsList
			{...props}
			primaryColor={resolvedPrimaryColor}
			label={label}
			title={title}
			value={value}
			rightElement={rightElement}
			rightIcon={resolvedRightIcon}
			onPress={handleOpen}
		/>
	);
};

export default SettingsListNumberInput;

const styles = StyleSheet.create({
	sheetView: {
		width: '100%',
		padding: 10,
		alignItems: 'stretch',
	},
	keyboardAvoidingView: {
		flex: 1,
		width: '100%',
	},
	keyboardAvoidingContent: {
		flexGrow: 1,
		alignItems: 'center',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 12,
	},
	inputContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	sheetInput: {
		flex: 1,
		height: 56,
		paddingHorizontal: 20,
		borderWidth: 1,
		fontSize: 18,
		textAlign: 'center',
	},
	affix: {
		fontSize: 14,
		fontWeight: '500',
	},
	stepButton: {
		width: 44,
		height: 44,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	rangeHint: {
		fontSize: 12,
		textAlign: 'center',
		marginTop: 6,
	},
	saveButton: {
		width: '100%',
		height: 48,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
