import React from 'react';
import {AuthProvider, ServerAPI} from '@/helper/database/server/ServerAPI';
import {useIsDebug} from '@/states/Debug';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {ButtonAuthProviderCustom} from '@/components/buttons/ButtonAuthProviderCustom';
import {CommonSystemActionHelper} from '@/helper/device/CommonSystemActionHelper';
import {isInExpoGoDev} from '@/helper/device/DeviceRuntimeHelper';
// The component to handle SSO login links
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {UrlHelper} from "@/helper/UrlHelper";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {View, Text} from "@/components/Themed";
import {Platform} from "react-native";
import {PlatformHelper} from "@/helper/PlatformHelper";
import Regexp from "ajv-keywords/src/keywords/regexp";
import {authentication, createDirectus, graphql, readMe, rest} from "@directus/sdk";

// Define the type for Single Sign-On (SSO) providers
type ButtonAuthProviderProps = {
    provider: AuthProvider,
	onSuccess?: (token: string) => void,
	onError?: (error: any) => void,
}

/**
 * New flow supports SSO login with Expo Go
function isSsoLoginPossible() {
	if (isInExpoGoDev()) { // app is running in expo go but on local ip (192....),
		// which means the redirect url would not trigger the deep link,
		// resulting in not opening the app,
		// so the SSO login does not work
		return false;
	}
	return true;
}
	*/


export const ButtonAuthProvider = ({ provider, onError, onSuccess }: ButtonAuthProviderProps) => {
	const isDebug = useIsDebug();
	const translation_log_in_with = useTranslation(TranslationKeys.sign_in_with);

	const [modalConfig, setModalConfig] = useModalGlobalContext();

	// https://docs.directus.io/self-hosted/sso.html

	let providerName = provider.name;
	providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);

	const accessibilityLabel = translation_log_in_with + ': ' + providerName;
	let text = translation_log_in_with + ': ' + providerName;

	const desiredRedirectURL = UrlHelper.getURLToLogin();
	const url = ServerAPI.getUrlToProviderLogin(provider);
	//const disabled = !isSsoLoginPossible();
	const disabled = false; // New flow supports SSO login with Expo Go

	if (disabled) {
		text += '\nDoes not work on local ExpoGo';
	}

	if (isDebug) {
		text += '\nDebug: URL: ' + url;
	}

	async function getToken(){
		console.log("Get TOKEN");
		const client = createDirectus('https://test.rocket-meals.de/rocket-meals/api/')
			.with(authentication('session', { credentials: 'include' }))
			.with(rest({ credentials: 'include' }))  // Include credentials in REST requests
			.with(graphql({ credentials: 'include' })); // Include credentials in GraphQL requests

		console.log("Call refresh");
		const data = await client.refresh(); //

		await client.request(readMe());

		const token = await client.getToken();
		console.log("token: "+token);
	}

	const onPress = async () => {
		if (PlatformHelper.isWeb()) {
			const WEB_CHECK_INTERVAL = 25; // ms , set to 25ms to get a fast response

			// Web-specific logic
			const authWindow = window.open(url, '_blank', 'width=500,height=600');
			const authCheckInterval = setInterval(() => {
				if(!!authWindow){
					try {
						if (authWindow.closed) {
							clearInterval(authCheckInterval);
						} else {
							const currentLocationNewWindow = new URL(authWindow.location.href);
							console.log("check current location: "+currentLocationNewWindow);
							if(currentLocationNewWindow+""===desiredRedirectURL+""){
								console.log("yes, arrived at the desired redirect url")
								authWindow.close();
								clearInterval(authCheckInterval);
								getToken();
							}
						}
					} catch (e: any) {
						// Handle errors if needed
						if(onError) {
							onError(e);
						}
					}
				}
			}, WEB_CHECK_INTERVAL);
		} else {
			// Mobile-specific logic
			const REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });

			const result = await WebBrowser.openAuthSessionAsync(url, UrlHelper.getURLToLogin());
			console.log("ButtonAuthProvider result: ", result);

			if (result.type === 'success' && result.url) {
				console.log(result);
				getToken();
			}
		}
	};


	return (
		// @ts-ignore
		<ButtonAuthProviderCustom
			key={'ssoButton' + provider.name}
			disabled={disabled}
			accessibilityLabel={accessibilityLabel}
			onPress={onPress}
			icon_name={provider.name}
			text={text}
		/>
	);
};
