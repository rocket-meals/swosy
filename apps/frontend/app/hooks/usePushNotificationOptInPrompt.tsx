import React, { useCallback } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ProjectButton from '@/components/ProjectButton';
import { getValue, setValue } from '@/constants/AsyncStorageHelper';
import { NotificationHelper } from '@/helper/NotificationHelper';
import { syncCurrentDevicePushNotificationState } from '@/helper/PushNotificationDeviceSync';
import { getPushNotificationOptInAction } from '@/helper/PushNotificationOptInHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { configureStore } from '@/redux/store';

// Belongs to the device, not to the user: whether this device was already asked. Not cleared on logout.
const LAST_ASKED_STORAGE_KEY = 'push_notification_opt_in_prompt_last_asked_at';

/**
 * Asks a user with a profile whether they want push notifications, right after they did
 * something they may get an answer to (app feedback, feature wish, comment on a food).
 *
 * iOS shows its system permission dialog exactly once - a "no" there can only be undone in the
 * system settings. On iOS we therefore first explain in our own modal and only trigger the system
 * dialog when the user agreed. On Android the system dialog can be shown again, so it is shown
 * directly. See {@link getPushNotificationOptInAction} for when nothing is asked.
 */
const usePushNotificationOptInPrompt = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const dispatch = useDispatch();

	// The profile is read when needed: the callers update it (e.g. a feedback) right before asking.
	const syncDevice = useCallback(async () => {
		await syncCurrentDevicePushNotificationState({ profile: configureStore.getState().authReducer.profile, dispatch });
	}, [dispatch]);

	const requestSystemPermission = useCallback(async () => {
		const permission = await NotificationHelper.requestDeviceNotificationPermission();
		if (permission?.granted) {
			await syncDevice();
		}
	}, [syncDevice]);

	const showExplanationModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.notification),
			children: (
				<View style={{ gap: 12 }}>
					<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.push_notification_opt_in_description)}</Text>
					<ProjectButton
						text={translate(TranslationKeys.push_notification_opt_in_accept)}
						onPress={() => {
							close();
							void requestSystemPermission();
						}}
						style={{ marginVertical: 0 }}
					/>
					<TouchableOpacity onPress={close} style={{ alignSelf: 'center', paddingVertical: 6 }}>
						<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.push_notification_opt_in_later)}</Text>
					</TouchableOpacity>
				</View>
			),
		});
	}, [close, requestSystemPermission, show, theme.screen.text, translate]);

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
		if (action === 'explain') {
			showExplanationModal();
		} else {
			await requestSystemPermission();
		}
	}, [requestSystemPermission, showExplanationModal, syncDevice]);

	return { askForPushNotifications };
};

export default usePushNotificationOptInPrompt;
