import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { isWeb } from '@/constants/Constants';
import { TranslationKeys } from '@/locales/keys';
import { FormHelperCommon } from 'repo-depkit-common';
import { useGiroCardIbanScannerModal } from '@/components/GiroCardIbanScanner';
import { isTextRecognitionSupported } from '@/helper/TextRecognitionHelper';

export interface IBANInputProps {
	id: string;
	value: string;
	onChange: (id: string, value: string, custom_type: string) => void;
	onError: (id: string, error: string) => void;
	error: string;
	isDisabled: boolean;
	custom_type: string;
	prefix: string | null | undefined;
	suffix: string | null | undefined;
	/**
	 * Accept an IBAN whose checksum does not add up when scanning. Only the
	 * experimental screen sets this, to scan specimen cards — see
	 * `packages/common/src/__tests__/fixtures/girocard`.
	 */
	allowInvalidScannedChecksum?: boolean;
}

const IBANInput = ({ id, value, onChange, onError, error, isDisabled, custom_type, prefix, suffix, allowInvalidScannedChecksum }: IBANInputProps) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, selectedTheme } = useAppSelector((state) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');
	const { openGiroCardIbanScanner } = useGiroCardIbanScannerModal();
	const flag = !suffix && !prefix;

	// The scan button is only offered where the device can actually recognize
	// text; on a platform without OCR the IBAN is typed in as before.
	const isScanAvailable = !isDisabled && isTextRecognitionSupported();

	const formatIBAN = (text: string) => FormHelperCommon.formatIban(text);

	const applyIban = (text: string) => {
		const formattedText = formatIBAN(text);
		onChange(id, formattedText, custom_type);
		if (formattedText.length > 0 && formattedText.length < 15) {
			onError(id, translate(TranslationKeys.iban_invalid_length));
		} else {
			onError(id, '');
		}
	};

	const handleScanPress = () => {
		openGiroCardIbanScanner({
			allowInvalidChecksum: allowInvalidScannedChecksum,
			onIbanDetected: (formattedIban) => applyIban(formattedIban),
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.inputContainer}>
				{prefix && (
					<View
						style={{
							...styles.prefix,
							width: isWeb ? '5%' : '10%',
							backgroundColor: theme.screen.iconBg,
						}}
					>
						<Text style={{ ...styles.label, color: theme.screen.text }}>{prefix}</Text>
					</View>
				)}
				<TextInput
					style={[
						styles.ibanInput,
						flag
							? {
									flex: 1,
									borderRadius: 10,
								}
							: {
									flex: 1,
								},
						{ color: theme.screen.text },
					]}
					cursorColor={theme.screen.text}
					placeholderTextColor={theme.screen.placeholder}
					onChangeText={applyIban}
					value={value}
					placeholder={translate(TranslationKeys.iban_format)}
					keyboardType="default"
					enterKeyHint="next"
					autoCapitalize="characters"
					editable={!isDisabled}
					maxLength={34} // IBAN max length
				/>
				{suffix && (
					<View
						style={{
							...styles.suffix,
							width: isWeb ? '5%' : '10%',
							backgroundColor: theme.screen.iconBg,
						}}
					>
						<Text style={{ ...styles.label, color: theme.screen.text }}>{suffix}</Text>
					</View>
				)}
				{isScanAvailable && (
					<TouchableOpacity style={[styles.scanButton, { backgroundColor: primaryColor }]} onPress={handleScanPress} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.giro_card_scan_title)} accessibilityHint={translate(TranslationKeys.giro_card_scan_hint)}>
						<MaterialCommunityIcons name="credit-card-scan-outline" size={24} color={contrastColor} />
					</TouchableOpacity>
				)}
			</View>
			{Boolean(error) && <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	inputContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 10,
		paddingVertical: 5,
		gap: 8,
	},
	ibanInput: {
		height: 50,
		// Without this the <input> keeps its intrinsic width on web and the scan
		// button next to it is pushed out of the row.
		minWidth: 0,
		fontFamily: 'Poppins_400Regular',
		borderWidth: 1,
		outlineWidth: 0,
		outlineColor: 'transparent',
		borderColor: '#3A3A3A',
		fontSize: 16,
		textAlign: 'left',
		paddingHorizontal: 20,
	},
	prefix: {
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#3A3A3A',
		borderTopLeftRadius: 10,
		borderBottomLeftRadius: 10,
	},
	suffix: {
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#3A3A3A',
		borderTopRightRadius: 10,
		borderBottomRightRadius: 10,
	},
	scanButton: {
		height: 50,
		width: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 10,
	},
	label: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	errorText: {
		fontSize: 10,
		marginTop: 5,
	},
});

export default IBANInput;
