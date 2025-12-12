import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useSelector } from 'react-redux';
import styles from './styles';
import { NicknameSheetProps } from './types';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/ColorHelper';

const NicknameSheet: React.FC<NicknameSheetProps> = ({ closeSheet, initialValue, onSave }) => {
        const { theme } = useTheme();
        const { translate } = useLanguage();
        const { primaryColor, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
        const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

        const [value, setValue] = useState(initialValue);

        useEffect(() => {
                setValue(initialValue);
        }, [initialValue]);

        const disableSave = useMemo(() => value?.trim() === initialValue?.trim(), [initialValue, value]);

	const Content = (
		<View
			style={{
				...styles.sheetView,
				backgroundColor: theme.sheet.sheetBg,
			}}
		>
			{/* Header */}
			<View style={styles.sheetHeader}>
				<View />
				<Text
					style={{
						...styles.sheetHeading,
						color: theme.sheet.text,
					}}
				>
					{translate(TranslationKeys.nickname)}
				</Text>
			</View>

			<TextInput
				style={{
					...styles.sheetInput,
					color: theme.sheet.text,
					backgroundColor: theme.sheet.inputBg,
					borderColor: theme.sheet.inputBorder,
				}}
				placeholder={translate(TranslationKeys.nickname)}
				placeholderTextColor={theme.sheet.placeholder}
				cursorColor={theme.sheet.text}
				selectionColor={primaryColor}
                                value={value}
                                onChangeText={setValue}
			/>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					onPress={() => {
						Keyboard.dismiss();
						closeSheet();
					}}
					style={{
						...styles.cancelButton,
						borderColor: primaryColor,
					}}
				>
					<Text style={[styles.buttonText, { color: theme.screen.text }]}>{translate(TranslationKeys.cancel)}</Text>
				</TouchableOpacity>

                                <TouchableOpacity
                                        onPress={() => {
                                                Keyboard.dismiss();
                                                onSave(value);
                                        }}
                                        disabled={disableSave}
                                        style={{
						...styles.saveButton,
						backgroundColor: primaryColor,
						opacity: disableSave ? 0.5 : 1,
					}}
				>
					<Text style={[styles.buttonText, { color: contrastColor }]}>{translate(TranslationKeys.save)}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	if (Platform.OS === 'web') {
		return <BottomSheetView>{Content}</BottomSheetView>;
	}

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
			<BottomSheetView>{Content}</BottomSheetView>
		</KeyboardAvoidingView>
	);
};

export default NicknameSheet;
