import React, { useCallback, useMemo } from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import { getMobileWebPlatform, isRunningAsInstalledWebApp, useNativeAppInstalledStatus } from './helpers';

export interface AppDownloadBannerTexts {
	/** App / project name shown as the banner title. */
	title: string;
	/** Subtitle shown while the install state is unknown (e.g. "Download or open the app"). */
	subtitle: string;
	/** Subtitle shown when the native app was detected on the device (e.g. "App already installed"). */
	installedSubtitle?: string;
	/** Button label when the app is (or might be) already installed (e.g. "Open"). */
	openButtonLabel: string;
	/** Button label when the app was NOT detected on the device (e.g. "Install"). Falls back to openButtonLabel. */
	installButtonLabel?: string;
	/** Accessibility label for the dismiss (close) button. */
	dismissAccessibilityLabel?: string;
}

export interface AppDownloadBannerProps {
	texts: AppDownloadBannerTexts;
	/** App icon shown on the left. */
	iconSource?: ImageSourcePropType;
	/** Accent color for the call-to-action button (usually the project's primary color). */
	accentColor: string;
	/** Whether the current theme is the dark theme - used for contrast color calculation. */
	isDarkTheme?: boolean;
	/**
	 * Store URL for the current platform (App Store / Play Store). The banner
	 * renders nothing when this is missing.
	 */
	storeUrl?: string | null;
	/**
	 * Android package name (applicationId). When provided it is matched against
	 * navigator.getInstalledRelatedApps() to detect an installed native app.
	 */
	androidPackageName?: string;
	/** Called with the store URL when the visitor taps the button and the app is not known to be installed. */
	onOpenStore: (storeUrl: string) => void;
	/** Called instead of onOpenStore when the native app was detected as installed (e.g. open via deep link). */
	onOpenApp?: () => void;
	/** Called when the visitor dismisses the banner. */
	onDismiss: () => void;
	/** Allows the parent to hide the banner (kiosk mode, dismissed state, ...). Defaults to true. */
	visible?: boolean;
	testID?: string;
}

/**
 * App-store-style "get the app" banner intended for the very top of a web app
 * when visited from a mobile browser. Purely presentational plus device
 * detection - dismiss persistence, translations and store URL resolution are
 * the caller's responsibility.
 *
 * When the native Android app can be positively detected via
 * navigator.getInstalledRelatedApps() the banner switches to an "already
 * installed" appearance (check badge + open label). On iOS there is no web
 * API for this, so the banner always falls back to its plain install/open
 * button there - deliberately not paired with an apple-itunes-app meta tag,
 * since that tag is baked into the HTML at build time and cannot react to an
 * in-app runtime customer/backend switch the way this component does.
 */
const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({
	texts,
	iconSource,
	accentColor,
	isDarkTheme,
	storeUrl,
	androidPackageName,
	onOpenStore,
	onOpenApp,
	onDismiss,
	visible = true,
	testID,
}) => {
	const { theme } = useTheme();
	const mobilePlatform = useMemo(() => getMobileWebPlatform(), []);
	const runningStandalone = useMemo(() => isRunningAsInstalledWebApp(), []);
	const installedStatus = useNativeAppInstalledStatus(androidPackageName);
	const isInstalled = installedStatus === 'installed';

	const handlePress = useCallback(() => {
		if (isInstalled && onOpenApp) {
			onOpenApp();
			return;
		}
		if (storeUrl) {
			onOpenStore(storeUrl);
		}
	}, [isInstalled, onOpenApp, onOpenStore, storeUrl]);

	if (!visible || Platform.OS !== 'web' || !mobilePlatform || runningStandalone || !storeUrl) {
		return null;
	}

	const contrastColor = myContrastColor(accentColor, theme, !!isDarkTheme);
	const subtitle = isInstalled && texts.installedSubtitle ? texts.installedSubtitle : texts.subtitle;
	const buttonLabel = isInstalled ? texts.openButtonLabel : texts.installButtonLabel || texts.openButtonLabel;

	return (
		<View style={[styles.container, { backgroundColor: theme.header.background, borderBottomColor: theme.screen.iconBg }]} testID={testID}>
			<TouchableOpacity
				onPress={onDismiss}
				style={styles.closeButton}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				accessibilityRole="button"
				accessibilityLabel={texts.dismissAccessibilityLabel || 'Close'}
			>
				<MaterialCommunityIcons name="close" size={20} color={theme.screen.icon} />
			</TouchableOpacity>
			<View style={styles.iconWrapper}>
				{iconSource ? (
					<Image source={iconSource} style={[styles.appIcon, { backgroundColor: theme.screen.iconBg }]} accessibilityLabel={texts.title} />
				) : (
					<View style={[styles.appIcon, styles.iconFallback, { backgroundColor: theme.screen.iconBg }]}>
						<MaterialCommunityIcons name="cellphone-arrow-down" size={24} color={theme.screen.icon} />
					</View>
				)}
				{isInstalled && (
					<View style={[styles.installedBadge, { borderColor: theme.header.background }]}>
						<MaterialCommunityIcons name="check" size={10} color="#ffffff" />
					</View>
				)}
			</View>
			<View style={styles.textContainer}>
				<Text numberOfLines={1} style={[styles.title, { color: theme.header.text }]}>
					{texts.title}
				</Text>
				<Text numberOfLines={1} style={[styles.subtitle, { color: theme.screen.placeholder }]}>
					{subtitle}
				</Text>
			</View>
			<TouchableOpacity onPress={handlePress} style={[styles.openButton, { backgroundColor: accentColor }]} accessibilityRole="button" accessibilityLabel={buttonLabel}>
				<Text style={[styles.openButtonLabel, { color: contrastColor }]}>{buttonLabel}</Text>
			</TouchableOpacity>
		</View>
	);
};

const INSTALLED_BADGE_COLOR = '#2e9e5b';

const styles = StyleSheet.create({
	container: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 12,
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
		zIndex: 10,
	},
	closeButton: {
		padding: 4,
	},
	iconWrapper: {
		width: 44,
		height: 44,
	},
	appIcon: {
		width: 44,
		height: 44,
		borderRadius: 10,
		resizeMode: 'contain',
	},
	iconFallback: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	installedBadge: {
		position: 'absolute',
		right: -4,
		bottom: -4,
		width: 16,
		height: 16,
		borderRadius: 8,
		borderWidth: 2,
		backgroundColor: INSTALLED_BADGE_COLOR,
		alignItems: 'center',
		justifyContent: 'center',
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
		minWidth: 84,
		alignItems: 'center',
	},
	openButtonLabel: {
		fontSize: 14,
		fontFamily: 'Poppins_600SemiBold',
	},
});

export default AppDownloadBanner;
