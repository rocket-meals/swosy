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
import * as Crypto from 'expo-crypto';
import {authentication, createDirectus, graphql, readMe, rest} from "@directus/sdk";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

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

	function renderDebugItem(debugItem: Record<any, any>){
		let renderedItems: any[] = [];
		let keys = Object.keys(debugItem);
		for(let key of keys){
			renderedItems.push(<View>
				<Text>
					{key+":"}
				</Text>
				<Text>{
					JSON.stringify(debugItem[key], null, 2)
				}</Text>
				<Text>
					{"--------"}
				</Text>
			</View>)
		}

		if(isDebug){
			setModalConfig({
				title: "DEBUG",
				accessibilityLabel: accessibilityLabel,
				label: "DEBUG",
				key: 'DEBUG',
				renderAsContentInsteadItems: (key: string, hide: () => void) => {
					return(
						<MyScrollView>
							{renderedItems}
						</MyScrollView>
					)
				}
			})
		}
	}

	// https://docs.directus.io/self-hosted/sso.html

	let providerName = provider.name;
	const providerNameInDirectusAuthProviderList = provider.name;
	providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);

	const accessibilityLabel = translation_log_in_with + ': ' + providerName;
	let text = translation_log_in_with + ': ' + providerName;

	const desiredRedirectURL = UrlHelper.getURLToLogin(); // same domain as frontend is running

	// This is not possible, as we can only catch the browser url from the same origin
	// So we need to have our own domain / myapp scheme
	//const desiredRedirectURL = ServerAPI.getServerUrl()+"/admin/login";

	async function getToken(code_verifier: string, code: string){
		//console.log("Get TOKEN");
		try{
			// Fetching refresh token explicitly if not set by session cookie
			const token_url = ServerAPI.getServerUrl() + '/proof-key-code-exchange/token'

			const requestBody = {
				code_verifier: code_verifier,
				code: code
			};

			const response = await fetch(token_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			//console.log(response);
			const json = await response.json();
			// const directus_session_token = json.directus_session_token; // not send anymore
			const directus_refresh_token = json.directus_refresh_token;
			if(!!directus_refresh_token){
				if(onSuccess){
					onSuccess(directus_refresh_token);
				}
			}

		} catch (err: any){
			console.log("error: ")
			console.log(err);
			console.log(err.toString())
		}
	}

	// Generate a random code verifier
	const generateCodeVerifier = async () => {
		const bytesMinAmount = 32;
		const bytesMaxAmount = 96;
		const bytesAmount = bytesMinAmount;
		const printableAsciiStart = 33; // ASCII value of '!'
		const printableAsciiEnd = 126;  // ASCII value of '~'
		const printableAsciiRange = printableAsciiEnd - printableAsciiStart + 1; // Calculate the range

		const array = await Crypto.getRandomBytesAsync(bytesAmount); // Generates 32 random bytes
		return Array.from(array, byte => String.fromCharCode(printableAsciiStart + (byte % printableAsciiRange))).join('');
	};

	// Generate a code challenge using the S256 method
	const generateCodeChallenge = async (codeVerifier: string) => {
		const digest = await Crypto.digestStringAsync(
			Crypto.CryptoDigestAlgorithm.SHA256,
			codeVerifier,
			{ encoding: Crypto.CryptoEncoding.BASE64 }
		);
		// Adjust the base64url encoding
		return digest.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	};

	const onPress = async () => {
		//console.log("START PKCE");
		let debugObj: Record<any, any> = {}
		const authorize_url = ServerAPI.getServerUrl() + '/proof-key-code-exchange/authorize'
		debugObj.authorize_url = authorize_url
		renderDebugItem(debugObj)
		const provider = providerNameInDirectusAuthProviderList;
		const redirect_url = desiredRedirectURL;
		const code_challenge_method = "S256";
		//console.log("code_verifier")
		const code_verifier = await generateCodeVerifier();
		debugObj.code_verifier = code_verifier
		renderDebugItem(debugObj)
		//console.log(code_verifier)
		//console.log("code_challenge")
		const code_challenge = await generateCodeChallenge(code_verifier);
		debugObj.code_challenge = code_challenge
		renderDebugItem(debugObj)
		//console.log(code_challenge)

		const requestBody = {
			provider: provider, // e.g., 'google'
			code_challenge: code_challenge,
			redirect_url: redirect_url, // e.g., 'myapp://redirect'
			code_challenge_method: code_challenge_method, // or 'plain' if not using S256
		};

		//console.log("Fetch authorize url: "+authorize_url);

		try{
			const response = await fetch(authorize_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			//console.log("Response:")
			//console.log(response)
			let json = await response.json()
			//console.log(json)
			const urlToProviderLogin = json.urlToProviderLogin;
			const url = urlToProviderLogin;

			debugObj.urlToProviderLogin = urlToProviderLogin
			renderDebugItem(debugObj)

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
								//console.log("check current location: "+currentLocationNewWindow);

								if((currentLocationNewWindow+"").startsWith(desiredRedirectURL+"")){
									//console.log("yes, arrived at the desired redirect url")
									authWindow.close();
									const code_splits = (currentLocationNewWindow+"").split("code=");
									const code = code_splits[1];
									console.log(code);

									debugObj.code = code
									renderDebugItem(debugObj)

									clearInterval(authCheckInterval);
									getToken(code_verifier, code);
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
				const options:  WebBrowser.AuthSessionOpenOptions = {
					preferEphemeralSession: false // iOS browser doesn’t share cookies or other browsing data between the authentication session
				}
				//console.log("desiredRedirectURL: "+desiredRedirectURL)
				let result = await WebBrowser.openAuthSessionAsync(url, desiredRedirectURL, options);
				//console.log("ButtonAuthProvider result: ", result);

				debugObj.result = result
				renderDebugItem(debugObj)

				if (result.type === 'success' && result.url) {
					//console.log("Redirected?")
					const currentLocation = result.url;
					const fragmentIndex = currentLocation.indexOf('#'); // why does expo add a # to the url? // well lets get rid of it
					const hasFragment = fragmentIndex !== -1;

					const urlWithoutFragment = hasFragment ? currentLocation.substring(0, fragmentIndex) : currentLocation;
					const code_splits = urlWithoutFragment.split("code=");
					const code = code_splits[1]?.split('&')[0]; // Handle cases where other parameters may follow

					debugObj.code = code;
					renderDebugItem(debugObj);

					getToken(code_verifier, code);
				}
			}
		} catch (err: any){
			console.log("Err: ")
			console.log(err);
			debugObj.err = err
			renderDebugItem(debugObj)
		}
	};


	return (
		// @ts-ignore
		<ButtonAuthProviderCustom
			key={'ssoButton' + provider.name}
			accessibilityLabel={accessibilityLabel}
			onPress={onPress}
			icon_name={provider.name}
			text={text}
		/>
	);
};
