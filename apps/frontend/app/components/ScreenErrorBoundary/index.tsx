import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

/** What Expo Router hands the `ErrorBoundary` export of a route. */
export interface ScreenErrorBoundaryProps {
	error: Error;
	retry: () => Promise<void>;
}

/**
 * The guard rail around a whole screen.
 *
 * Expo Router renders a route's `ErrorBoundary` export in place of the screen
 * once that screen has thrown, so a single failing field no longer closes the
 * app. A route opts in with one line:
 *
 * ```ts
 * export { ScreenErrorBoundary as ErrorBoundary } from '@/components/ScreenErrorBoundary';
 * ```
 *
 * It says that something went wrong, offers to try again and a way back, and
 * logs the error - it does not show the error text, which is not written for
 * the people using the app.
 */
export const ScreenErrorBoundary = ({ error, retry }: ScreenErrorBoundaryProps) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();

	React.useEffect(() => {
		// eslint-disable-next-line no-console
		console.error('Screen crashed and was replaced by its error boundary', error);
	}, [error]);

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
		} else {
			router.navigate('/');
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<Ionicons name="warning-outline" size={48} color={theme.screen.icon} />
			<Text style={[styles.title, { color: theme.screen.text }]}>{translate(TranslationKeys.somethingWentWrong)}</Text>
			<Text style={[styles.description, { color: theme.screen.text }]}>{translate(TranslationKeys.screen_error_description)}</Text>
			<View style={styles.actions}>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: theme.screen.iconBg }]}
					onPress={() => {
						retry().catch(() => {});
					}}
					accessibilityRole="button"
					accessibilityLabel={translate(TranslationKeys.screen_error_retry)}
				>
					<Text style={[styles.buttonText, { color: theme.screen.text }]}>{translate(TranslationKeys.screen_error_retry)}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: theme.screen.iconBg }]}
					onPress={goBack}
					accessibilityRole="button"
					accessibilityLabel={translate(TranslationKeys.navigate_back)}
				>
					<Text style={[styles.buttonText, { color: theme.screen.text }]}>{translate(TranslationKeys.navigate_back)}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		gap: 12,
	},
	title: {
		fontSize: 20,
		fontFamily: 'Poppins_700Bold',
		textAlign: 'center',
	},
	description: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		maxWidth: 480,
	},
	actions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
		marginTop: 8,
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	buttonText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
});

export default ScreenErrorBoundary;
