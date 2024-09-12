import {Redirect, useGlobalSearchParams, useLocalSearchParams, usePathname, useRootNavigationState} from 'expo-router';
import React, {useState} from 'react';
import {Text} from '@/components/Themed'
import {isUserLoggedIn} from '@/states/User';
import {MyDrawerAuthenticated} from '@/components/drawer/MyDrawerAuthenticated';
import {useSearchParamKioskMode} from "@/helper/searchParams/SearchParams";
import {useTermsAndPrivacyConsentAcceptedDate} from "@/states/ConsentStatus";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: 'index'
};

export default function AppLayout() {
	const [termsAndPrivacyConsentAcceptedDate, setTermsAndPrivacyConsentAcceptedDate] = useTermsAndPrivacyConsentAcceptedDate()
	const consentAcceptedTermsAndPrivacy = termsAndPrivacyConsentAcceptedDate !== null
	
	const params = useLocalSearchParams()
	console.log('AppLayout: params: ', params)
	const globalSearchParams = useGlobalSearchParams()
	console.log('AppLayout: globalSearchParams: ', globalSearchParams)
	const kioskMode = useSearchParamKioskMode()
	const [isInKioskMode, setIsInKioskMode] = useState(kioskMode) // we use a state to prevent loss of the initial value when redirecting as expo redirects us to the initial route
	console.log('AppLayout: noAccount: ', kioskMode)
	console.log('AppLayout: skipLoggedInCheck: ', isInKioskMode)

	let loggedIn = isUserLoggedIn();
	console.log('AppLayout: loggedIn: ', loggedIn)
	const pathName = usePathname();
	console.log('AppLayout: pathName: ', pathName)
	const rootNavigationState = useRootNavigationState();

	//https://stackoverflow.com/questions/76828511/expo-router-error-attempted-to-navigate-before-mounting-the-root-layout-compone
	const isLoading = !rootNavigationState?.key
	console.log('AppLayout: isLoading: ', isLoading)

	// AUTHENTICATION: Followed this guide: https://docs.expo.dev/router/reference/authentication/

	// You can keep the splash screen open, or render a loading screen like we do here.

	if (isLoading) {
		return <Text>Loading...</Text>;
	}

	// Only require authentication within the (app) group's layout as users
	// need to be able to access the (auth) group and sign in again.
	if(!isInKioskMode){
		if ((!loggedIn || !consentAcceptedTermsAndPrivacy)) {
			// On web, static rendering will stop here as the user is not authenticated
			// in the headless Node process that the pages are rendered in.
			// @ts-ignore
			return <Redirect href="/(auth)/login" />;
		}
	}

	// This layout can be deferred because it's not the root layout.
	return <>
		<MyDrawerAuthenticated />
	</>
}
