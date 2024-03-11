import { Slot} from 'expo-router';
import React, {useEffect} from 'react';





import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {PlatformHelper} from '@/helper/PlatformHelper';

// https://docs.expo.dev/versions/latest/sdk/notifications/#handle-push-notifications-with-navigation
function useNotificationObserver() {
	useEffect(() => {
		let isMounted = true;

		function redirect(notification: Notifications.Notification) {
			const url = notification.request.content.data?.url;
			if (url) {
				router.push(url);
			}
		}

		Notifications.getLastNotificationResponseAsync()
			.then(response => {
				if (!isMounted || !response?.notification) {
					return;
				}
				redirect(response?.notification);
			});

		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			redirect(response.notification);
		});

		return () => {
			isMounted = false;
			subscription.remove();
		};
	}, []);
}

export interface RootNotificationDeepLinkProps {
  children?: React.ReactNode;
}
export const RootNotificationDeepLink = (props: RootNotificationDeepLinkProps) => {
	if (PlatformHelper.isSmartPhone()) {
		useNotificationObserver();
	}

	// Show notification when app is in foreground
	// https://stackoverflow.com/questions/56689701/expo-dont-show-notification-if-app-is-open-in-foreground
	Notifications.setNotificationHandler(null);

	return (
		<Slot />
	)
}