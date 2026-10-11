import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { getMaintenanceNotice, MaintenanceNotice } from '@/helper/maintenanceWindowHelper';
import { onServerOutageSuspected } from '@/helper/serverOutageHelper';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import MyMarkdownProjectColored from '@/components/MyMarkdownProjectColored';

/** At most one maintenance refresh per this many milliseconds, failing requests come in bursts. */
const OUTAGE_REFRESH_THROTTLE_MS = 30 * 1000;

type MaintenanceModalContentProps = {
	notice: MaintenanceNotice;
	message?: string | null;
};

const MaintenanceModalContent: React.FC<MaintenanceModalContentProps> = ({ notice, message }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const noticeText = notice.phase === 'upcoming' ? interpolateTranslation(translate(TranslationKeys.maintenance_upcoming_notice), { start: format(notice.start, 'HH:mm'), end: format(notice.end, 'HH:mm') }) : interpolateTranslation(translate(TranslationKeys.maintenance_active_notice), { end: format(notice.end, 'HH:mm') });

	return (
		<View style={styles.content}>
			<View style={styles.noticeRow}>
				<MaterialCommunityIcons name="wrench-clock" size={28} color={theme.screen.icon} />
				<Text style={[styles.noticeText, { color: theme.screen.text }]}>{noticeText}</Text>
			</View>
			{message ? <MyMarkdownProjectColored content={message} /> : null}
		</View>
	);
};

/** Opens the maintenance modal for the current maintenance window, e.g. from the MaintenanceBanner. */
export const useShowMaintenanceModal = () => {
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	return useCallback(
		(notice: MaintenanceNotice, message?: string | null) => {
			show({
				title: translate(TranslationKeys.maintenance),
				children: <MaintenanceModalContent notice={notice} message={message} />,
			});
		},
		[show, translate]
	);
};

/**
 * Shows a modal with app_settings.maintenance_start/_end/_message:
 * - when the app starts during or shortly before a maintenance window,
 * - when an already running app gets answers that look like an outage
 *   (see helper/serverOutageHelper.ts). It then reloads the maintenance fields
 *   first: while Directus restarts, the maintenance server answers them.
 * Each window phase (upcoming, active) is shown at most once per app start.
 * Mounted once in the root layout, renders nothing itself.
 */
const MaintenanceModal: React.FC = () => {
	const dispatch = useDispatch();
	const kioskMode = useKioskMode();
	const showMaintenanceModal = useShowMaintenanceModal();
	const appSettings = useAppSelector(state => state.settings.appSettings);
	const maintenanceStart = appSettings?.maintenance_start;
	const maintenanceEnd = appSettings?.maintenance_end;
	const [checkRequest, setCheckRequest] = useState(0);
	const shownNoticeKeysRef = useRef(new Set<string>());

	const appSettingsRef = useRef(appSettings);
	appSettingsRef.current = appSettings;
	const showMaintenanceModalRef = useRef(showMaintenanceModal);
	showMaintenanceModalRef.current = showMaintenanceModal;

	// On start, when the window changes and after a suspected outage.
	useEffect(() => {
		if (kioskMode) {
			return;
		}
		const notice = getMaintenanceNotice(maintenanceStart, maintenanceEnd, new Date());
		if (!notice) {
			return;
		}
		const noticeKey = `${notice.phase}-${maintenanceStart}`;
		if (shownNoticeKeysRef.current.has(noticeKey)) {
			return;
		}
		shownNoticeKeysRef.current.add(noticeKey);
		showMaintenanceModalRef.current(notice, appSettingsRef.current?.maintenance_message);
	}, [kioskMode, maintenanceStart, maintenanceEnd, checkRequest]);

	useEffect(() => {
		if (kioskMode) {
			return;
		}
		let lastRefresh = 0;
		return onServerOutageSuspected(() => {
			const now = Date.now();
			if (now - lastRefresh < OUTAGE_REFRESH_THROTTLE_MS) {
				return;
			}
			lastRefresh = now;
			new AppSettingsHelper()
				.fetchMaintenanceWindow()
				.then(maintenanceWindow => {
					dispatch({ type: SET_APP_SETTINGS, payload: { ...appSettingsRef.current, ...maintenanceWindow } });
				})
				.catch(error => {
					// Without an answer the cached window may still apply.
					console.log('MaintenanceModal: could not refresh the maintenance window', error);
				})
				.finally(() => setCheckRequest(request => request + 1));
		});
	}, [kioskMode]);

	return null;
};

const styles = StyleSheet.create({
	content: {
		gap: 16,
		paddingBottom: 16,
	},
	noticeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	noticeText: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
});

export default MaintenanceModal;
