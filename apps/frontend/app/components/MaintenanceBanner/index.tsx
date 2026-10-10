import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { interpolateTranslation } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { SET_APP_SETTINGS } from '@/redux/Types/types';
import { AppSettingsHelper } from '@/redux/actions/AppSettings/AppSettings';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import useKioskMode from '@/hooks/useKioskMode';
import { TranslationKeys } from '@/locales/keys';
import { getMaintenanceNotice, getMillisecondsUntilNextMaintenanceChange } from '@/helper/maintenanceWindowHelper';

/**
 * Warns about a server maintenance (e.g. the daily backend restart) from 30
 * minutes before app_settings.maintenance_start until maintenance_end.
 * Mounted once in the root layout. The app settings are persisted, so the
 * notice keeps working while the server is down.
 */
const MaintenanceBanner: React.FC = () => {
	const dispatch = useDispatch();
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const kioskMode = useKioskMode();
	const { appSettings, primaryColor } = useAppSelector(state => state.settings);
	const maintenanceStart = appSettings?.maintenance_start;
	const maintenanceEnd = appSettings?.maintenance_end;
	const [now, setNow] = useState(() => new Date());
	const [dismissedKey, setDismissedKey] = useState<string | null>(null);

	// Re-render exactly when the notice appears, changes its phase or disappears.
	useEffect(() => {
		const delay = getMillisecondsUntilNextMaintenanceChange(maintenanceStart, maintenanceEnd, now);
		if (delay === null) {
			return;
		}
		const timeout = setTimeout(() => setNow(new Date()), delay + 1000);
		return () => clearTimeout(timeout);
	}, [maintenanceStart, maintenanceEnd, now]);

	// The app settings are loaded on app start only. Apps resumed from the
	// background would miss an announcement, so refresh the two fields then.
	const appSettingsRef = useRef(appSettings);
	appSettingsRef.current = appSettings;
	useEffect(() => {
		if (kioskMode) {
			return;
		}
		let appState: AppStateStatus = AppState.currentState;
		const subscription = AppState.addEventListener('change', nextState => {
			const cameToForeground = appState !== 'active' && nextState === 'active';
			appState = nextState;
			if (!cameToForeground) {
				return;
			}
			setNow(new Date());
			new AppSettingsHelper()
				.fetchAppSettings({ fields: ['maintenance_start', 'maintenance_end'] })
				.then(result => {
					if (result) {
						dispatch({ type: SET_APP_SETTINGS, payload: { ...appSettingsRef.current, maintenance_start: result.maintenance_start, maintenance_end: result.maintenance_end } });
					}
				})
				.catch(error => {
					console.log('MaintenanceBanner: could not refresh the maintenance window', error);
				});
		});
		return () => subscription.remove();
	}, [kioskMode]);

	const notice = getMaintenanceNotice(maintenanceStart, maintenanceEnd, now);
	if (kioskMode || !notice) {
		return null;
	}
	const noticeKey = `${notice.phase}-${maintenanceStart}`;
	if (dismissedKey === noticeKey) {
		return null;
	}

	const message =
		notice.phase === 'upcoming'
			? interpolateTranslation(translate(TranslationKeys.maintenance_upcoming_notice), { start: format(notice.start, 'HH:mm'), end: format(notice.end, 'HH:mm') })
			: interpolateTranslation(translate(TranslationKeys.maintenance_active_notice), { end: format(notice.end, 'HH:mm') });

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, borderLeftColor: primaryColor }]} accessibilityRole="alert">
			<MaterialCommunityIcons name="wrench-clock" size={22} color={theme.screen.icon} />
			<View style={styles.textContainer}>
				<Text style={[styles.title, { color: theme.screen.text }]}>{translate(TranslationKeys.maintenance)}</Text>
				<Text style={[styles.message, { color: theme.screen.text }]}>{message}</Text>
			</View>
			<TouchableOpacity onPress={() => setDismissedKey(noticeKey)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.hide)} hitSlop={8}>
				<MaterialCommunityIcons name="close" size={20} color={theme.screen.icon} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderLeftWidth: 4,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 14,
		fontFamily: 'Poppins_700Bold',
	},
	message: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
	},
});

export default MaintenanceBanner;
