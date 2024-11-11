import React, {useEffect, useState} from 'react';
import { useSyncState} from '@/helper/syncState/SyncState';
import {ServerAPI, ServerInfo} from '@/helper/database/server/ServerAPI';
import {Text, View} from '@/components/Themed';
import {useServerInfoRaw} from '@/states/SyncStateServerInfo';
import {PersistentSecureStore} from '@/helper/syncState/PersistentSecureStore';
import {AuthenticationData} from '@directus/sdk';
import {SecureStorageHelperAbstractClass} from '@/helper/storage/SecureStorageHelperAbstractClass';
import {
	LoadingScreen,
	LoadingScreenFullScreenOverlay,
	LoadingScreenTextInformationWrapper
} from "@/compositions/loadingScreens/LoadingScreen";
import {useIsDebug} from "@/states/Debug";
import {PleaseConnectFirstTimeWithInternet} from "@/compositions/loadingScreens/PleaseConnectFirstTimeWithInternet";
import {PleaseConnectLaterServerIsOffline} from "@/compositions/loadingScreens/PleaseConnectLaterServerIsOffline";
import {MyButton} from "@/components/buttons/MyButton";
import {RootTranslationKey, useRootTranslation} from "@/helper/translations/RootTranslation";
import {IconNames} from "@/constants/IconNames"; // Optional if you want to use default theme

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export interface ServerStatusFlowLoaderProps {
    children?: React.ReactNode;
}

export const RootServerStatusFlowLoader = (props: ServerStatusFlowLoaderProps) => {

	const isDebug = useIsDebug();

	const translation_check_server_status = useRootTranslation(RootTranslationKey.CHECK_SERVER_STATUS)
	const translation_server_is_offline = useRootTranslation(RootTranslationKey.SERVER_IS_OFFLINE)
	const translation_continue_with_cache = useRootTranslation(RootTranslationKey.CONTINUE_WITH_CACHE)
	const translation_retry_in_seconds = useRootTranslation(RootTranslationKey.RETRY_IN_SECONDS)

	const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());
	const nowAsKey = nowInMs.toString();
	const [continueWithCache, setContinueWithCache] = useState<boolean>(false);
	const [amountOfRetries, setAmountOfRetries] = useState<number>(0);

	const SECONDS_TILL_RELOAD = 10;
	const [reloadTimer, setReloadTimer] = useState<number>(SECONDS_TILL_RELOAD);
	const SECONDS_TILL_PROCEED_WITH_CACHED_DATA = 5;
	const [proceedWithCachedDataTimer, setProceedWithCachedDataTimer] = useState<number>(SECONDS_TILL_PROCEED_WITH_CACHED_DATA);

	const [serverInfo, setServerInfo, serverInfoRaw, setServerInfoRaw] = useServerInfoRaw();
	let usedServerInfo = serverInfo;
	const [authData, setAuthData] = useSyncState<AuthenticationData, AuthenticationData>(PersistentSecureStore.authentificationData)

	// TODO: move this to a helper function
	ServerAPI.createAuthentificationStorage(async () => {
		// We can't use the authData directly, because it is a hook and the data is not updated yet when we call this function
		// So we have to fetch the data from the storage directly
		const authDataRaw = await SecureStorageHelperAbstractClass.getItem(PersistentSecureStore.authentificationData)
		if (!authDataRaw) {
			return null;
		} else {
			return JSON.parse(authDataRaw)
		}
	}, async (newAuthData) => {
		setAuthData((currentAuthData) => {
			return newAuthData
		}) // update the hook but its set asyncronous, so we have to update the storage directly
		await SecureStorageHelperAbstractClass.setItem(PersistentSecureStore.authentificationData, JSON.stringify(newAuthData)) // but hook is async, so we have to update the storage directly
	})

	async function loadServerInfo(){
		let remote_server_info = await ServerAPI.downloadServerInfo();
		console.log('ServerInfoRaw', remote_server_info)

		if (remote_server_info.status === 'offline') {
			console.log("Server is offline at fetching remote")
			let cachedServerInfo = usedServerInfo
			console.log('cachedServerInfo', cachedServerInfo)
			if (cachedServerInfo) {
				console.log("Server is offline at fetching remote, but we have local data")
				remote_server_info = cachedServerInfo;
				remote_server_info.status = 'cached'
			}
		}

		return remote_server_info
	}

	async function checkIfProcessWithCachedDataPossible(){
		const cachedServerInfo = usedServerInfo;
		if (cachedServerInfo) {
			console.log("We have cached data available");
			cachedServerInfo.status = 'cached';
			setServerInfo((currentServerInfo) => {
				return cachedServerInfo;
			}, nowAsKey);
		} else {
			console.log("No cached data available");
			// Handle the case where there's no cached data
			// set serverInfo null
			setServerInfo((currentServerInfo) => {
				return null;
			}, nowAsKey);
		}
	}

	async function loadInformation() {
		console.log('RootServerStatusFlowLoader: loadInformation')

		const TIMEOUT_IN_SECONDS = 5;
		const timeoutInMillis = 1000 * TIMEOUT_IN_SECONDS;
		const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("timedout"), timeoutInMillis));

		const serverLoadPromise = loadServerInfo();

		try {
			const remote_server_info_unkownType = await Promise.race([serverLoadPromise, timeoutPromise]);
			const remote_server_info = remote_server_info_unkownType as ServerInfo;

			// If we get here, it means loadServerInfo resolved before timeout
			setServerInfo((currentServerInfo) => {
				return remote_server_info;
			}, nowAsKey);
		} catch (error) {
			// If we get here, it means timeout occurred or loadServerInfo rejected
			console.log("Error: ", error);
			checkIfProcessWithCachedDataPossible();
		}
	}

	useEffect(() => {
		loadInformation();
	}, []);

	let serverInfoNotUpdated = (!serverInfoRaw?.sync_cache_composed_key_local || serverInfoRaw?.sync_cache_composed_key_local !== nowAsKey)
	const isLoading = serverInfoNotUpdated || (usedServerInfo===undefined)
	const isOffline = usedServerInfo===null || usedServerInfo?.status === 'offline'
	const isCached = usedServerInfo?.status === "cached" && !continueWithCache

	// Use Effect when server is offline and no cached data is available
	useEffect(() => {
		if(isOffline && !isCached) {
			// then we want to show set a timer which starts the download again after 5 seconds
			if(reloadTimer > 0) {
				const timer = setTimeout(() => {
					setReloadTimer(reloadTimer-1)
				}, 1000);
				return () => clearTimeout(timer);
			} else {
				loadInformation();
				setReloadTimer(10);
				setAmountOfRetries((currentAmountOfRetries) => {
					return currentAmountOfRetries + 1
				})
			}
		}
	}, [isOffline, reloadTimer])

	// Use Effect when server is offline and cached data is available
	useEffect(() => {
		if(isCached) {
			if(proceedWithCachedDataTimer > 0) {
				const timer = setTimeout(() => {
					setProceedWithCachedDataTimer(proceedWithCachedDataTimer-1)
				}, 1000);
				return () => clearTimeout(timer);
			} else {
				setContinueWithCache(true)
				setProceedWithCachedDataTimer(SECONDS_TILL_PROCEED_WITH_CACHED_DATA)
			}
		}
	}, [isCached, proceedWithCachedDataTimer])


	const debugInformation = <>
		<Text>{'serverInfoRaw?.sync_cache_composed_key_local - '+serverInfoRaw?.sync_cache_composed_key_local}</Text>
		<Text>{'nowAsKey: '+nowAsKey}</Text>
		<Text>{JSON.stringify(usedServerInfo, null, 2)}</Text>
	</>

	// 1. load server information
	if (isLoading) {
		return (
			<LoadingScreen>
			<LoadingScreenTextInformationWrapper>
				<Text>{translation_check_server_status}</Text>
				{isDebug && debugInformation}
			</LoadingScreenTextInformationWrapper>
			</LoadingScreen>
		)
	}

	if (isOffline) {
		return (
			<LoadingScreen>
				<LoadingScreenFullScreenOverlay>
					<PleaseConnectLaterServerIsOffline>
						<Text>
							{translation_retry_in_seconds+": "+reloadTimer+"s"}
						</Text>
						<Text>
							{"Amount of retries: "+amountOfRetries}
						</Text>
					</PleaseConnectLaterServerIsOffline>
				</LoadingScreenFullScreenOverlay>
			</LoadingScreen>
		)
	}

	if(isCached) {
		return (
			<LoadingScreen>
			<LoadingScreenTextInformationWrapper>
				<Text>{translation_server_is_offline}</Text>
				<View style={{
					marginTop: 20,
				}}>
					<MyButton useOnlyNecessarySpace={true} accessibilityLabel={translation_continue_with_cache+": "+(proceedWithCachedDataTimer)+"s"} onPress={() => {
						setContinueWithCache(true)
					}} text={translation_continue_with_cache+": "+(proceedWithCachedDataTimer)+"s"} rightIcon={IconNames.chevron_right_icon} />
				</View>
			</LoadingScreenTextInformationWrapper>
			</LoadingScreen>
		)
	}

	// in case server is offline, but we have cached data or server is online we can continue

	return (
		props.children
	)
}
