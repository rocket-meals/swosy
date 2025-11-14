import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { styles } from './styles';
import { useTheme } from '@/hooks/useTheme';
import { SheetProps } from './types';
import { useLanguage } from '@/hooks/useLanguage';
import { useSelector } from 'react-redux';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/ColorHelper';
import { EmailHelper } from 'repo-depkit-common';

const ManagementSheet: React.FC<SheetProps> = ({ closeSheet, handleLogin, loading }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { primaryColor, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const [formState, setFormState] = useState({
		email: '',
		password: '',
		isEmailValid: false,
		isPasswordValid: false,
	});

        const validateEmail = (email: string) => {
                const { trimmedEmail, isValid } = EmailHelper.sanitizeAndValidate(email);
                setFormState(prevState => ({
                        ...prevState,
                        email: trimmedEmail,
                        isEmailValid: isValid,
                }));
        };

        const validatePassword = (password: string) => {
                setFormState(prevState => ({
                        ...prevState,
                        password,
                        isPasswordValid: password.length > 0,
                }));
        };

	const isFormValid = formState.isEmailValid && formState.isPasswordValid;

	return (
		<BottomSheetScrollView style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }} contentContainerStyle={styles.contentContainer}>
			<View style={styles.sheetHeader}></View>
			<Text style={{ ...styles.sheetHeading, color: theme.sheet.text }}>{translate(TranslationKeys.show_login_for_management_with_email_and_password)}</Text>
			<Text style={{ ...styles.sheetSubHeading, color: theme.sheet.text }}>{translate(TranslationKeys.management_login_description)}</Text>
			<TextInput
				style={{
					...styles.sheetInput,
					color: theme.sheet.text,
					backgroundColor: theme.sheet.inputBg,
					borderColor: formState.isEmailValid ? theme.sheet.inputBorderValid : theme.sheet.inputBorderInvalid,
				}}
				placeholderTextColor={theme.sheet.placeholder}
				cursorColor={theme.sheet.text}
				selectionColor={primaryColor}
				onChangeText={validateEmail}
				value={formState.email}
				placeholder="You@swosy.com"
			/>
			<TextInput
				style={{
					...styles.sheetInput,
					color: theme.sheet.text,
					backgroundColor: theme.sheet.inputBg,
					borderColor: formState.isPasswordValid ? theme.sheet.inputBorderValid : theme.sheet.inputBorderInvalid,
				}}
				onChangeText={validatePassword}
				placeholderTextColor={theme.sheet.placeholder}
				cursorColor={theme.sheet.text}
				selectionColor={primaryColor}
				value={formState.password}
				secureTextEntry
				placeholder="Password"
			/>
			<TouchableOpacity
				style={{
					...styles.sheetLoginButton,
					backgroundColor: isFormValid ? primaryColor : theme.sheet.buttonDisabled,
				}}
				disabled={!isFormValid}
                                onPress={() =>
                                        handleLogin(
                                                undefined,
                                                EmailHelper.sanitize(formState.email),
                                                formState.password
                                        )
                                }
                        >
				{loading ? (
					<ActivityIndicator size={'small'} color={theme.screen.text} />
				) : (
					<Text
						style={{
							...styles.sheetLoginLabel,
							color: isFormValid ? contrastColor : theme.screen.text,
						}}
					>
						{translate(TranslationKeys.sign_in)}
					</Text>
				)}
			</TouchableOpacity>
		</BottomSheetScrollView>
	);
};

export default ManagementSheet;
