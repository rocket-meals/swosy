import {Redirect, usePathname, useRootNavigationState} from 'expo-router';
import React from 'react';
import {Text} from '@/components/Themed'
import {isUserLoggedIn} from '@/states/User';
import {MyDrawerAuthenticated} from '@/components/drawer/MyDrawerAuthenticated';
import {PopupEventsOverlay} from "@/compositions/popupEvents/PopupEventsOverlay";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: 'index',
};

export default function AppLayout() {
	const loggedIn = isUserLoggedIn();
	const pathName = usePathname();
	const rootNavigationState = useRootNavigationState();

	//https://stackoverflow.com/questions/76828511/expo-router-error-attempted-to-navigate-before-mounting-the-root-layout-compone
	const isLoading = !rootNavigationState?.key

	// AUTHENTICATION: Followed this guide: https://docs.expo.dev/router/reference/authentication/

	// You can keep the splash screen open, or render a loading screen like we do here.

	if (isLoading) {
		return <Text>Loading...</Text>;
	}

	// Only require authentication within the (app) group's layout as users
	// need to be able to access the (auth) group and sign in again.
	if (!loggedIn) {
		// On web, static rendering will stop here as the user is not authenticated
		// in the headless Node process that the pages are rendered in.
		// @ts-ignore
		return <Redirect href="/(auth)/login" />;
	}

	// This layout can be deferred because it's not the root layout.
	return <>
		<MyDrawerAuthenticated />
		<PopupEventsOverlay />
	</>
}
