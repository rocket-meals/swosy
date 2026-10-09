import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { registerForPushNotificationsAsync } from '@/helper/getPushToken';
import { syncCurrentDevicePushNotificationState } from '@/helper/PushNotificationDeviceSync';
import type { Subscription } from 'expo-notifications';
import { Platform } from 'react-native';
import { markOnboardingShouldBeShownAfterLogin } from '@/helper/onboardingIntentHelper';

export const extractRawExpoToken = (token: string | null) => {
	if (!token) return null;
	const m = /\[([^\]]{1,200})\]/.exec(String(token));
	return m ? m[1] : token;
};

const Index = () => {
	const dispatch = useDispatch();
	const { loggedIn, profile } = useAppSelector((state) => state.authReducer);

	useEffect(() => {
		if (!loggedIn || !profile?.id) return;
		if (Platform.OS === 'web') return;

		let subscription: Subscription | undefined;

		(async () => {

			// The system permission dialog can be shown only once on iOS (twice on Android 13+), so it
			// is never shown at app start - only after our own explanation (usePushNotificationOptInPrompt).
			const token = await registerForPushNotificationsAsync({ requestPermission: false });
			if (token) {
				await syncCurrentDevicePushNotificationState({ profile, dispatch });
			}

			const Notifications = await import('expo-notifications');
			subscription = Notifications.addNotificationReceivedListener(() => {});
		})();

		return () => {
			if (subscription && typeof subscription.remove === 'function') {
				subscription.remove();
			}
		};
	}, [loggedIn, profile?.id]);

	if (loggedIn) {
		return <Redirect href="/(app)" />;
	} else {
		markOnboardingShouldBeShownAfterLogin();
		return <Redirect href="/(auth)/login" />;
	}
};

export default Index;