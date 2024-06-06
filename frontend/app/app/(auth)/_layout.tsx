import React, {useState} from 'react';
import {Text} from '@/components/Themed'
import {DrawerContent} from '@react-navigation/drawer';
import {useIsLargeDevice} from '@/helper/device/DeviceHelper';
import {Drawer} from 'expo-router/drawer';
import {isUserLoggedIn} from '@/states/User';
import {useRootNavigationState} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: 'login',
};


function DrawerContentWrapper(props: any) {
	const registeredRoutes = props?.state?.routeNames;

	const rootNavigationState = useRootNavigationState();

	//https://stackoverflow.com/questions/76828511/expo-router-error-attempted-to-navigate-before-mounting-the-root-layout-compone
	const isLoading = !rootNavigationState?.key

	// AUTHENTICATION: Followed this guide: https://docs.expo.dev/router/reference/authentication/

	// You can keep the splash screen open, or render a loading screen like we do here.

	if (isLoading) {
		return <Text>Loading...</Text>;
	}

	/**
     * TODO: Find a nice way to show only routes for users role
     * TODO: Render routes with expandable subroutes like in: https://stackoverflow.com/questions/47766564/need-to-show-expandable-list-view-inside-navigation-drawer
     * registeredRoutes = [ "home/index", "playground/index", "settings/index", "index", "playground/syncStates/index" ]
     */

	/**
     * FOR REFERENCE:
     export { default as DrawerContent } from './views/DrawerContent';
     export { default as DrawerContentScrollView } from './views/DrawerContentScrollView';
     export { default as DrawerItem } from './views/DrawerItem';
     export { default as DrawerItemList } from './views/DrawerItemList';
     export { default as DrawerToggleButton } from './views/DrawerToggleButton';
     export { default as DrawerView } from './views/DrawerView';
     */

	return (
		<DrawerContent {...props} />
	);
}

function DrawerWrapper(props: any) {
	const isLargeDevice = useIsLargeDevice();
	return (
		<Drawer
			backBehavior={"history"}
			drawerContent={DrawerContentWrapper}
			screenOptions={{
				drawerType: isLargeDevice ? 'front' : 'front',
			}}
			{...props}
		/>
	);
}

function AppLayoutDrawer() {
	return (
		<DrawerWrapper >
			<Drawer.Screen
				name="login" // This is the name of the page and must match the url from root
				options={{
					drawerLabel: 'Login',
					title: 'Login',
					headerShown: false,
				}}
			/>
		</DrawerWrapper>
	);
}


export default function AppLayout() {
	const [ isLoading, setIsLoading ] = useState<boolean>(false);
	const loggedIn = isUserLoggedIn();

	// AUTHENTICATION: Followed this guide: https://docs.expo.dev/router/reference/authentication/

	// You can keep the splash screen open, or render a loading screen like we do here.
	if (isLoading) {
		return <Text>Loading...</Text>;
	}

	// Only require authentication within the (app) group's layout as users
	// need to be able to access the (auth) group and sign in again.
	/**
    if (loggedIn) {
        // On web, static rendering will stop here as the user is not authenticated
        // in the headless Node process that the pages are rendered in.
        // @ts-ignore
        return <Redirect href="(app)" />;
    }
        */

	// This layout can be deferred because it's not the root layout.
	return <AppLayoutDrawer />
}
