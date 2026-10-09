import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import SettingsListBoolean from '@/components/SettingsListBoolean';
import { getValue, setValue } from '@/constants/AsyncStorageHelper';
import { myContrastColor } from '@/helper/ColorHelper';
import useFreeApartmentsNotification from '@/hooks/useFreeApartmentsNotification';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';

// Belongs to the device: whether the hint at the top of the housing screen was closed. Not cleared on logout.
const PANEL_DISMISSED_STORAGE_KEY = 'housing_free_apartments_notification_panel_dismissed';

const useHousingAreaColor = (): string => {
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const housingAreaColor = useAppSelector(state => state.settings.appSettings?.housing_area_color);
	return housingAreaColor || primaryColor;
};

/** Button that switches the notification on, used in the panel and in the "free rooms" modal. */
const FreeApartmentsNotificationButton: React.FC<{ onEnabled?: () => void }> = ({ onEnabled }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const selectedTheme = useAppSelector(state => state.settings.selectedTheme);
	const housingAreaColor = useHousingAreaColor();
	const { setEnabled, saving } = useFreeApartmentsNotification();
	const contrastColor = myContrastColor(housingAreaColor, theme as Parameters<typeof myContrastColor>[1], selectedTheme === 'dark');

	const onPress = useCallback(async () => {
		await setEnabled(true);
		onEnabled?.();
	}, [onEnabled, setEnabled]);

	return (
		<TouchableOpacity
			style={[styles.button, { backgroundColor: housingAreaColor }]}
			onPress={() => void onPress()}
			disabled={saving}
			accessibilityRole="button"
			accessibilityLabel={translate(TranslationKeys.housing_free_apartments_notification)}
		>
			{saving ? <ActivityIndicator color={contrastColor} /> : <MaterialIcons name="notifications-active" size={20} color={contrastColor} />}
			<Text style={[styles.buttonText, { color: contrastColor }]}>{translate(TranslationKeys.housing_free_apartments_notification)}</Text>
		</TouchableOpacity>
	);
};

/**
 * Content for the "free rooms" modal of an apartment card: the hint plus the button, or a
 * confirmation once the notification is on.
 */
export const FreeApartmentsNotificationModalSection: React.FC = () => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { isEnabled } = useFreeApartmentsNotification();

	if (isEnabled) {
		return <Text style={[styles.text, styles.centered, { color: theme.screen.text }]}>{translate(TranslationKeys.housing_free_apartments_notification_enabled)}</Text>;
	}
	return (
		<View style={styles.section}>
			<Text style={[styles.text, styles.centered, { color: theme.screen.text }]}>{translate(TranslationKeys.housing_free_apartments_notification_hint)}</Text>
			<FreeApartmentsNotificationButton />
		</View>
	);
};

/** Switch for the options modal of the housing screen. */
export const FreeApartmentsNotificationToggle: React.FC<{ groupPosition: 'top' | 'middle' | 'bottom' | 'single' }> = ({ groupPosition }) => {
	const { translate } = useLanguage();
	const housingAreaColor = useHousingAreaColor();
	const { isEnabled, toggle, isAccountRequired, openAccountRequiredModal, saving } = useFreeApartmentsNotification();

	return (
		<SettingsListBoolean
			iconBgColor={housingAreaColor}
			leftIcon={<MaterialIcons name={isEnabled ? 'notifications-active' : 'notifications-off'} size={20} />}
			label={translate(TranslationKeys.housing_free_apartments_notification)}
			isEnabled={isEnabled}
			onToggle={() => void toggle()}
			disabled={saving}
			valueActive={translate(TranslationKeys.active)}
			valueInactive={translate(TranslationKeys.inactive)}
			groupPosition={groupPosition}
			isAccountRequired={isAccountRequired}
			onAccountRequired={openAccountRequiredModal}
		/>
	);
};

/**
 * Hint at the top of the housing screen offering the notification about free apartments. Hidden
 * once the notification is on or the user closed it.
 */
export const FreeApartmentsNotificationPanel: React.FC = () => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const housingAreaColor = useHousingAreaColor();
	const selectedTheme = useAppSelector(state => state.settings.selectedTheme);
	const { isEnabled } = useFreeApartmentsNotification();
	// Hidden until the stored state is read, so a closed panel does not flash up.
	const [dismissed, setDismissed] = useState<boolean | null>(null);

	useEffect(() => {
		let active = true;
		getValue(PANEL_DISMISSED_STORAGE_KEY).then(value => {
			if (active) setDismissed(value === true);
		});
		return () => {
			active = false;
		};
	}, []);

	const dismiss = useCallback(() => {
		setDismissed(true);
		void setValue(PANEL_DISMISSED_STORAGE_KEY, true);
	}, []);

	if (dismissed !== false || isEnabled) {
		return null;
	}

	return (
		<View style={[styles.panel, { backgroundColor: theme.card.background, borderColor: housingAreaColor }]}>
			<View style={styles.panelHeader}>
				<View style={[styles.iconCircle, { backgroundColor: housingAreaColor }]}>
					<MaterialCommunityIcons name="door-open" size={22} color={myContrastColor(housingAreaColor, theme as Parameters<typeof myContrastColor>[1], selectedTheme === 'dark')} />
				</View>
				<Text style={[styles.text, styles.panelText, { color: theme.screen.text }]}>{translate(TranslationKeys.housing_free_apartments_notification_hint)}</Text>
				<TouchableOpacity onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.hide)}>
					<MaterialIcons name="close" size={22} color={theme.screen.text} />
				</TouchableOpacity>
			</View>
			<FreeApartmentsNotificationButton />
		</View>
	);
};

const styles = StyleSheet.create({
	section: {
		gap: 12,
		marginTop: 16,
	},
	text: {
		fontSize: 15,
		fontFamily: 'Poppins_400Regular',
	},
	centered: {
		textAlign: 'center',
	},
	panel: {
		width: '100%',
		borderWidth: 1,
		borderRadius: 14,
		padding: 14,
		gap: 12,
		marginBottom: 12,
	},
	panelHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	panelText: {
		flex: 1,
	},
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 10,
		minHeight: 43,
		paddingHorizontal: 16,
	},
	buttonText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
		flexShrink: 1,
	},
});
