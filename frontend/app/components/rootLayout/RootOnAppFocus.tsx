import {NotificationHelper} from "@/helper/notification/NotificationHelper";
import {useEffect, useRef, useState} from "react";
import {AppState} from "react-native";

export interface RootOnAppFocusProps {
	children?: React.ReactNode;
}
export const RootOnAppFocus = (props: RootOnAppFocusProps) => {

	const [notificationGranted, pushTokenObj, updateDeviceInformationAndRegisterIfNotFound, requestDeviceNotificationPermission] = NotificationHelper.useNotificationPermission();

	// if the app is focused
	const appState = useRef(AppState.currentState);
	const [appStateVisible, setAppStateVisible] = useState(appState.current);


	async function handleAppFocused() {
		// check and update the notification permission
		updateDeviceInformationAndRegisterIfNotFound();
	}

	// Used example of https://reactnative.dev/docs/appstate#basic-usage
	useEffect(() => {
		const subscription = AppState.addEventListener('change', nextAppState => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				console.log('App has come to the foreground!');
				handleAppFocused();
			}

			appState.current = nextAppState;
			setAppStateVisible(appState.current);
			//console.log('AppState', appState.current);
		});

		return () => {
			subscription.remove();
		};
	}, []);


	return (
		props.children
	)
}