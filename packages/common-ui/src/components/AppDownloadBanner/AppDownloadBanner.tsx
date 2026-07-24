import React, { useCallback, useMemo } from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import { getMobileWebPlatform } from './helpers';

export interface AppDownloadBannerTexts {
	/** App / project name shown as the banner title. */
	title: string;
	/** Subtitle shown below the title (e.g. "Download or open the app"). */
	subtitle: string;
	/** Button label (e.g. "Open"). */
	openButtonLabel: string;
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
	/** Called with the store URL when the visitor taps the button. */
	onOpenStore: (storeUrl: string) => void;
	/** Called when the visitor dismisses the banner. */
	onDismiss: () => void;
	/** Allows the parent to hide the banner (kiosk mode, dismissed state, ...). Defaults to true. */
	visible?: boolean;
	testID?: string;
}

/**
 * App-store-style "get the app" banner intended for the very top of a web app
 * when visited from a mobile browser. Purely presentational - dismiss
 * persistence, translations and store URL resolution are the caller's
 * responsibility.
 */
const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({ texts, iconSource, accentColor, isDarkTheme, storeUrl, onOpenStore, onDismiss, visible = true, testID }) => {
	const { theme } = useTheme();
	const mobilePlatform = useMemo(() => getMobileWebPlatform(), []);

	const handlePress = useCallback(() => {
		if (storeUrl) {
			onOpenStore(storeUrl);
		}
	}, [onOpenStore, storeUrl]);

	if (!visible || Platform.OS !== 'web' || !mobilePlatform || !storeUrl) {
		return null;
	}

	const contrastColor = myContrastColor(accentColor, theme, !!isDarkTheme);

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
			{iconSource ? (
				<Image source={iconSource} style={[styles.appIcon, { backgroundColor: theme.screen.iconBg }]} accessibilityLabel={texts.title} />
			) : (
				<View style={[styles.appIcon, styles.iconFallback, { backgroundColor: theme.screen.iconBg }]}>
					<MaterialCommunityIcons name="cellphone-arrow-down" size={24} color={theme.screen.icon} />
				</View>
			)}
			<View style={styles.textContainer}>
				<Text numberOfLines={1} style={[styles.title, { color: theme.header.text }]}>
					{texts.title}
				</Text>
				<Text numberOfLines={1} style={[styles.subtitle, { color: theme.screen.placeholder }]}>
					{texts.subtitle}
				</Text>
			</View>
			<TouchableOpacity onPress={handlePress} style={[styles.openButton, { backgroundColor: accentColor }]} accessibilityRole="button" accessibilityLabel={texts.openButtonLabel}>
				<Text style={[styles.openButtonLabel, { color: contrastColor }]}>{texts.openButtonLabel}</Text>
			</TouchableOpacity>
		</View>
	);
};

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
