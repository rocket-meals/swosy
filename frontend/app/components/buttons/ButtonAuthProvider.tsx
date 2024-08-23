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

// Define the type for Single Sign-On (SSO) providers
type SsoProvider = {
    provider: AuthProvider
}

function isSsoLoginPossible() {
	if (isInExpoGoDev()) { // app is running in expo go but on local ip (192....),
		// which means the redirect url would not trigger the deep link,
		// resulting in not opening the app,
		// so the SSO login does not work
		return false;
	}
	return true;
}

export const ButtonAuthProvider = ({ provider }: SsoProvider) => {
	const isDebug = useIsDebug();
	const translation_log_in_with = useTranslation(TranslationKeys.sign_in_with);

	const [modalConfig, setModalConfig] = useModalGlobalContext();

	let providerName = provider.name;
	providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);

	const accessibilityLabel = translation_log_in_with + ': ' + providerName;
	let text = translation_log_in_with + ': ' + providerName;

	const url = ServerAPI.getUrlToProviderLogin(provider);
	const disabled = !isSsoLoginPossible();

	if (disabled) {
		text += '\nDoes not work on local ExpoGo';
	}

	if (isDebug) {
		text += '\nDebug: URL: ' + url;
	}

	const onPress = async () => {
		const result = await WebBrowser.openAuthSessionAsync(url, UrlHelper.getURLToLogin());

		if (result.type === 'success' && result.url) {
			// Extrahiere den Token aus der Redirect-URL
			try{
				const directusToken = result.url.match(/directus_refresh_token=([^&]*)/)[1];
				if (directusToken) {
					console.log('Token found in URL: ' + directusToken);

					setModalConfig({
						key: "sort",
						label: "success " + directusToken,
						title: "success: " + directusToken,
						accessibilityLabel: "success",
						renderAsContentPreItems: (key: string, hide: () => void) => {
							return <View style={{
								width: '100%',
								height: '100%',
							}}>
								<Text>
									{"result.url: " + result.url}
								</Text>
								<Text>
									{"Success: " + directusToken}
								</Text>
							</View>
						}
					})

				} else {
					console.log('No token found in URL');

					setModalConfig({
						key: "sort",
						label: "error",
						title: "error",
						accessibilityLabel: "error",
						renderAsContentPreItems: (key: string, hide: () => void) => {
							return <View style={{
								width: '100%',
								height: '100%',
							}}>
								<Text>
									{"result.url: " + result.url}
								</Text>
								<Text>
									{"Error: "}
								</Text>
								<Text>
									{JSON.stringify(result, null, 2)}
								</Text>
							</View>
						}
					})
				}
			} catch (e) {
				console.log('Error while parsing URL: ', e);

				setModalConfig({
					key: "sort",
					label: "error",
					title: "error",
					accessibilityLabel: "error",
					renderAsContentPreItems: (key: string, hide: () => void) => {
						return <View style={{
							width: '100%',
							height: '100%',
						}}>
							<Text>
								{"result.url: " + result.url}
							</Text>
							<Text>
								{"Error: " + e}
							</Text>
						</View>
					}
				})
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

