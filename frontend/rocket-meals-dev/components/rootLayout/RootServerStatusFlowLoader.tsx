import React, {useEffect, useState} from 'react';
import { useSyncState} from '@/helper/syncState/SyncState';
import {ServerAPI} from '@/helper/database/server/ServerAPI';
import {Text, View} from '@/components/Themed';
import {useServerInfoRaw} from '@/states/SyncStateServerInfo';
import {PersistentSecureStore} from '@/helper/syncState/PersistentSecureStore';
import {AuthenticationData} from '@directus/sdk';
import {SecureStorageHelperAbstractClass} from '@/helper/storage/SecureStorageHelperAbstractClass';
import {LoadingScreen} from "@/compositions/loadingScreens/LoadingScreen";
import {useIsDebug} from "@/states/Debug"; // Optional if you want to use default theme

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export interface ServerStatusFlowLoaderProps {
    children?: React.ReactNode;
}

export const RootServerStatusFlowLoader = (props: ServerStatusFlowLoaderProps) => {

	const isDebug = useIsDebug();

	const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());
	const [serverInfo, setServerInfo, serverInfoRaw, setServerInfoRaw
	] = useServerInfoRaw();
	const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

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
		setAuthData(newAuthData) // update the hook but its set asyncronous, so we have to update the storage directly
		await SecureStorageHelperAbstractClass.setItem(PersistentSecureStore.authentificationData, JSON.stringify(newAuthData)) // but hook is async, so we have to update the storage directly
	})

	useEffect(() => {
		// call anonymous function
		(async () => {
			let remote_server_info = await ServerAPI.downloadServerInfo();
			console.log('ServerInfoRaw', remote_server_info)

			if (remote_server_info.status === 'offline') {
				//console.log("Server is offline at fetching remote")
				if (serverInfo) {
					//console.log("Server is offline at fetching remote, but we have local data")
					remote_server_info = serverInfo;
					remote_server_info.status = 'cached'
				}
			}

			setServerInfo(remote_server_info, nowInMs);
		})();
	}, []);

	const debugInformation = isDebug ? <Text>{JSON.stringify(serverInfo, null, 2)}</Text> : null;

	// 1. load server information
	if (serverInfoRaw?.lastUpdate !== nowInMs || !serverInfo) {
		return (
			<LoadingScreen>
				<Text>{'Loading server Info'}</Text>
				{debugInformation}
			</LoadingScreen>
		)
	}

	if (serverInfo.status === 'offline') {
		return (
			<LoadingScreen>
				<Text>{'Server is offline and no data is cached'}</Text>
				{debugInformation}
			</LoadingScreen>
		)
	}

	// in case server is offline, but we have cached data or server is online we can continue

	return (
		props.children
	)
}
