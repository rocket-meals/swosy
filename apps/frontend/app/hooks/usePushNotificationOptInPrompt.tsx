import React, { useCallback } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ProjectButton from '@/components/ProjectButton';
import { getValue, setValue } from '@/constants/AsyncStorageHelper';
import { NotificationHelper } from '@/helper/NotificationHelper';
import { syncCurrentDevicePushNotificationState } from '@/helper/PushNotificationDeviceSync';
import { getPushNotificationOptInAction, getPushNotificationPermissionStep } from '@/helper/PushNotificationOptInHelper';
import useFoodNotificationModal from '@/hooks/useFoodNotificationModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { configureStore } from '@/redux/store';

// Belongs to the device, not to the user: whether this device was already asked. Not cleared on logout.
const LAST_ASKED_STORAGE_KEY = 'push_notification_opt_in_prompt_last_asked_at';

/**
 * The system permission dialog for push notifications can be shown only once on iOS (twice on
 * Android 13+). A "no" there can only be undone in the system settings. So on both platforms the
 * app never shows it without first explaining in its own modal, and only triggers it when the
 * user agreed there:
 *
 * - {@link askForPushNotifications}: our suggestion after the user did something they may get an
 *   answer to (app feedback, feature wish, comment). Not repeated within 14 days.
 * - {@link ensurePushNotificationPermission}: the user switched on something that needs push
 *   notifications (food reminder, free apartments). Resolves whether the permission is there.
 */
const usePushNotificationOptInPrompt = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { openNotificationPermissionModal } = useFoodNotificationModal();

	// The profile is read when needed: the callers update it (e.g. a feedback) right before asking.
	const syncDevice = useCallback(async () => {
		await syncCurrentDevicePushNotificationState({ profile: configureStore.getState().authReducer.profile, dispatch });
	}, [dispatch]);

	/** Shows our explanation. Resolves `true` when the user agreed there and the system granted it. */
	const explainAndRequest = useCallback(
		(description: string) =>
			new Promise<boolean>(resolve => {
				let settled = false;
				const settle = (granted: boolean) => {
					if (!settled) {
						settled = true;
						resolve(granted);
					}
				};
				const accept = async () => {
					settled = true;
					close();
					const permission = await NotificationHelper.requestDeviceNotificationPermission();
					if (permission?.granted) {
						await syncDevice();
					}
					resolve(!!permission?.granted);
				};
				show(
					{
						title: translate(TranslationKeys.notification),
						children: (
							<View style={{ gap: 12 }}>
								<Text style={{ color: theme.screen.text }}>{description}</Text>
								<ProjectButton text={translate(TranslationKeys.push_notification_opt_in_accept)} onPress={() => void accept()} style={{ marginVertical: 0 }} />
								<TouchableOpacity
									onPress={() => {
										settle(false);
										close();
									}}
									style={{ alignSelf: 'center', paddingVertical: 6 }}
								>
									<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.push_notification_opt_in_later)}</Text>
								</TouchableOpacity>
							</View>
						),
					},
					{ onClosed: () => settle(false) }
				);
			}),
		[close, show, syncDevice, theme.screen.text, translate]
	);

	const askForPushNotifications = useCallback(async () => {
		if (!configureStore.getState().authReducer.profile?.id) {
			return;
		}
		const now = new Date();
		const action = getPushNotificationOptInAction({
			platform: Platform.OS,
			permission: await NotificationHelper.getDeviceNotificationPermission(),
			lastAskedAt: await getValue(LAST_ASKED_STORAGE_KEY),
			now,
		});
		if (action === 'sync') {
			// Nothing to ask, but make sure the backend knows the push token of this device.
			await syncDevice();
			return;
		}
		if (action === 'none') {
			return;
		}
		await setValue(LAST_ASKED_STORAGE_KEY, now.toISOString());
		await explainAndRequest(translate(TranslationKeys.push_notification_opt_in_description));
	}, [explainAndRequest, syncDevice, translate]);

	/**
	 * Without a system permission to ask for (web) this resolves `true`: whether a push can reach
	 * the user's phones is then up to the permission on those devices.
	 */
	const ensurePushNotificationPermission = useCallback(async (): Promise<boolean> => {
		const step = getPushNotificationPermissionStep({
			platform: Platform.OS,
			permission: await NotificationHelper.getDeviceNotificationPermission(),
		});
		if (step === 'unsupported') {
			return true;
		}
		if (step === 'granted') {
			await syncDevice();
			return true;
		}
		if (step === 'open_settings') {
			openNotificationPermissionModal();
			return false;
		}
		return explainAndRequest(translate(TranslationKeys.push_notification_permission_explanation));
	}, [explainAndRequest, openNotificationPermissionModal, syncDevice, translate]);

	return { askForPushNotifications, ensurePushNotificationPermission };
};

export default usePushNotificationOptInPrompt;
