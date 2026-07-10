import React, { useCallback, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useKioskMode from '@/hooks/useKioskMode';
import { getImageUrl } from '@/constants/HelperFunctions';
import { getAppIconInsideExpoLocalSaved, getCustomerConfig } from '@/config';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import { ServerInfoHelper } from '@/helper/ServerInfoHelper';
import { myContrastColor } from '@/helper/ColorHelper';

const DISMISSED_STORAGE_KEY = 'appDownloadBannerDismissed';

type MobileWebPlatform = 'ios' | 'android' | null;

const getMobileWebPlatform = (): MobileWebPlatform => {
	if (Platform.OS !== 'web' || typeof navigator === 'undefined') return null;
	const userAgent = navigator.userAgent || '';
	if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
	if (/Android/i.test(userAgent)) return 'android';
	return null;
};

const isDismissedInSession = (): boolean => {
	try {
		return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DISMISSED_STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
};

/**
 * GitHub-style "get the app" banner shown at the very top of the web app when
 * the visitor uses a mobile browser (and the app is not running in kiosk mode).
 * Store links come from app_settings (app_stores_url_to_apple/_google), with a
 * fallback built from the customer config's store identifiers.
 */
const AppDownloadBanner: React.FC = () => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const kioskMode = useKioskMode();
	const { appSettings, serverInfo, primaryColor, selectedTheme: mode } = useAppSelector(state => state.settings);
	const [dismissed, setDismissed] = useState<boolean>(() => isDismissedInSession());

	const mobilePlatform = useMemo(() => getMobileWebPlatform(), []);

	const storeUrl = useMemo(() => {
		if (!mobilePlatform) return null;
		const customerConfig = getCustomerConfig();
		if (mobilePlatform === 'ios') {
			if (appSettings?.app_stores_url_to_apple) return appSettings.app_stores_url_to_apple;
			if (customerConfig?.appleAppId) return `https://apps.apple.com/app/id${customerConfig.appleAppId}`;
			return null;
		}
		if (appSettings?.app_stores_url_to_google) return appSettings.app_stores_url_to_google;
		if (customerConfig?.bundleIdAndroid) return `https://play.google.com/store/apps/details?id=${customerConfig.bundleIdAndroid}`;
		return null;
	}, [mobilePlatform, appSettings?.app_stores_url_to_apple, appSettings?.app_stores_url_to_google]);

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		try {
			sessionStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
		} catch {
			// sessionStorage unavailable (e.g. blocked) - banner stays dismissed for this render only
		}
	}, []);

	const handleOpenStore = useCallback(() => {
		if (storeUrl) {
			CommonSystemActionHelper.openExternalURL(storeUrl, true);
		}
	}, [storeUrl]);

	if (Platform.OS !== 'web' || kioskMode || dismissed || !mobilePlatform || !storeUrl) {
		return null;
	}

	const projectLogo = serverInfo?.info?.project?.project_logo ? getImageUrl(serverInfo.info.project.project_logo) : null;
	const iconSource = projectLogo ? { uri: projectLogo } : getAppIconInsideExpoLocalSaved();
	const projectName = ServerInfoHelper.getServerName(serverInfo || {}, getCustomerConfig());
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

	return (
		<View style={[styles.container, { backgroundColor: theme.header.background, borderBottomColor: theme.screen.iconBg }]}>
			<TouchableOpacity onPress={handleDismiss} style={styles.closeButton} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.cancel)}>
				<MaterialCommunityIcons name="close" size={20} color={theme.screen.icon} />
			</TouchableOpacity>
			<Image source={iconSource} style={styles.appIcon} accessibilityLabel={projectName} />
			<View style={styles.textContainer}>
				<Text numberOfLines={1} style={[styles.title, { color: theme.header.text }]}>
					{projectName}
				</Text>
				<Text numberOfLines={1} style={[styles.subtitle, { color: theme.screen.placeholder }]}>
					{translate(TranslationKeys.download_or_open_the_app)}
				</Text>
			</View>
			<TouchableOpacity onPress={handleOpenStore} style={[styles.openButton, { backgroundColor: primaryColor }]} accessibilityRole="button">
				<Text style={[styles.openButtonLabel, { color: contrastColor }]}>{translate(TranslationKeys.app_banner_open)}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 10,
		gap: 10,
		borderBottomWidth: 1,
	},
	closeButton: {
		padding: 4,
	},
	appIcon: {
		width: 40,
		height: 40,
		borderRadius: 9,
		resizeMode: 'contain',
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 14,
		fontFamily: 'Poppins_600SemiBold',
	},
	subtitle: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
	},
	openButton: {
		paddingHorizontal: 18,
		paddingVertical: 8,
		borderRadius: 20,
	},
	openButtonLabel: {
		fontSize: 14,
		fontFamily: 'Poppins_600SemiBold',
	},
});

export default AppDownloadBanner;
