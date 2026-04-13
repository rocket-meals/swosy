import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { myContrastColor } from '@/helper/ColorHelper';
import { TimeInput } from '@/components/DateTimeInputs';
import styles from './styles';
import { FoodOffersNextDayTimeSheetProps } from './types';
import AppButton from '@/components/AppButton';

const DEFAULT_THRESHOLD = '18:00';

const FoodOffersNextDayTimeSheet: React.FC<FoodOffersNextDayTimeSheetProps> = ({ closeSheet, initialValue, onSave }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const mode = useAppSelector(state => state.settings.selectedTheme);
	const contrastColor = useMemo(() => myContrastColor(primaryColor, theme, mode === 'dark'), [mode, primaryColor, theme]);

	const [value, setValue] = useState(initialValue || DEFAULT_THRESHOLD);
	const [error, setError] = useState('');

	useEffect(() => {
		setValue(initialValue || DEFAULT_THRESHOLD);
		setError('');
	}, [initialValue]);

	const handleChange = useCallback((_: string, newValue: string) => {
		setValue(newValue);
	}, []);

	const handleError = useCallback(
		(_: string, message: string) => {
			if (message) {
				setError(translate(TranslationKeys.invalid_time_format));
			} else {
				setError('');
			}
		},
		[translate]
	);

	const handleSave = useCallback(() => {
		const sanitizedValue = (value || '').trim();
		const isValid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(sanitizedValue);
		if (!isValid) {
			setError(translate(TranslationKeys.invalid_time_format));
			return;
		}
		onSave(sanitizedValue);
	}, [onSave, translate, value]);

	const handleReset = useCallback(() => {
		onSave(null);
	}, [onSave]);

	const disableSave = !value || Boolean(error);
	const disableReset = !initialValue && value === DEFAULT_THRESHOLD;

	return (
		<BottomSheetView style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }}>
			<View style={styles.sheetHeader}>
				<Text style={{ ...styles.sheetHeading, color: theme.sheet.text }}>{translate(TranslationKeys.foodoffers_next_day_time)}</Text>
			</View>
			<Text style={{ ...styles.description, color: theme.sheet.text, opacity: 0.75 }}>{translate(TranslationKeys.foodoffers_next_day_time_description)}</Text>
			<View style={styles.inputContainer}>
				<TimeInput id="foodoffers-next-day-threshold" value={value} onChange={handleChange} onError={handleError} error={error} isDisabled={false} custom_type="time" prefix={null} suffix={null} />
			</View>
			<View style={styles.buttonContainer}>
				<AppButton
					text={translate(TranslationKeys.cancel)}
					onPress={closeSheet}
					variant="outline"
					style={[styles.buttonBase, styles.secondaryButton, { borderColor: primaryColor, marginRight: 12, marginVertical: 0 }]}
					textStyle={{ ...styles.buttonText, color: theme.sheet.text }}
				/>
				<AppButton
					text={translate(TranslationKeys.reset)}
					onPress={handleReset}
					variant="outline"
					disabled={disableReset}
					style={[styles.buttonBase, styles.secondaryButton, { borderColor: primaryColor, marginRight: 12, marginVertical: 0 }]}
					textStyle={{ ...styles.buttonText, color: theme.sheet.text }}
				/>
				<AppButton
					text={translate(TranslationKeys.save)}
					onPress={handleSave}
					variant="primary"
					disabled={disableSave}
					style={[styles.buttonBase, styles.primaryButton, { backgroundColor: primaryColor, marginVertical: 0 }]}
					textStyle={{ ...styles.buttonText, color: contrastColor }}
				/>
			</View>
		</BottomSheetView>
	);
};

export default FoodOffersNextDayTimeSheet;
