import {DependencyList, useEffect, useState} from 'react';
import {useIsServerCached, useIsServerOffline, useIsServerOnline} from '@/states/SyncStateServerInfo';
import {useIsDemo} from '@/states/SynchedDemo';
import {useCurrentUser, useIsCurrentUserAnonymous} from '@/states/User';
import {LoadingScreenDatabase} from '@/compositions/loadingScreens/LoadingScreenDatabase';
import {PleaseConnectFirstTimeWithInternet} from '@/compositions/loadingScreens/PleaseConnectFirstTimeWithInternet';
import {useSynchedDevices} from '@/states/SynchedDevices';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export interface RootAuthUserFlowLoaderProps {
  children?: React.ReactNode;
  syncForUserId: string | undefined
}

export interface RootAuthUserFlowLoaderInnerProps {
  children?: React.ReactNode;
  setSyncComplete: (finished: boolean) => void
}

export const RootSyncDatabaseUploadInner = (props: RootAuthUserFlowLoaderInnerProps) => {
	//console.log("AuthFlowUserCheck")

	const isServerOnline = useIsServerOnline()
	const isServerCached = useIsServerCached();

	const [currentUser, setUserWithCache] = useCurrentUser();
	const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

	const demo = useIsDemo()
	const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());

	const registeredItemsToLoad: any[] = [];

	const [devices, setDevices, lastUpdateDevices, updateDeviceIfNotRegistered] = useSynchedDevices()

	const synchedResourcesToDownloadFirst: {[key: string]: {data: any, lastUpdate: number | undefined}} = {}

	function addSynchedResourceToDownloadFirst(label: string, resource: any, lastUpdate: number | undefined) {
		registeredItemsToLoad.push(resource);
		synchedResourcesToDownloadFirst[label] = {
			data: resource,
			lastUpdate: lastUpdate
		}
	}

	/**
   * Needs to be called before the useEffect
   */
	if (!isCurrentUserAnonymous) {
		addSynchedResourceToDownloadFirst('devices', devices, lastUpdateDevices)
	}

	function getDependencies(): DependencyList {
		return registeredItemsToLoad;
	}

	const itemsToLoad = getDependencies();

	function checkSynchedResources() {
		//console.log("--- checkSynchedResources ---");
		const synchedResourceKeys = Object.keys(synchedResourcesToDownloadFirst)
		for (let i = 0; i < synchedResourceKeys.length; i++) {
			let isResourceSynched = false;
			const synchedResourceKey = synchedResourceKeys[i]
			const synchedResourceInformation = synchedResourcesToDownloadFirst[synchedResourceKey]
			const synchedResource = synchedResourceInformation?.data
			const synchedResourceLastUpdate = synchedResourceInformation?.lastUpdate
			//console.log("synchedResourceKey", synchedResourceKey)
			//console.log("synchedResourceInformation: ",synchedResourceInformation);
			if (isServerOnline) { // if server is online, we can check if we are logged in
				//console.log("server is online");
				if (synchedResourceLastUpdate != null) {
					isResourceSynched = !!synchedResource && !isNaN(synchedResourceLastUpdate) && synchedResourceLastUpdate === nowInMs
				} else {
					isResourceSynched = false
				}
			} else if (isServerCached) { // if server is offline, but we have cached data, we can check if we are logged in
				isResourceSynched = !!synchedResource
			}
			if (!isResourceSynched) {
				return false;
			}
		}
		return true
	}

	async function wait(ms: number) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}

	useEffect(() => {
		(async () => {
			//console.log("AuthFlowUserCheck useEffect")
			//console.log("refreshToken", refreshToken)

			if (isServerOnline) { // if server is online, we can check if we are logged in
				if (!demo) {
					await updateDeviceIfNotRegistered(nowInMs)
				}
			} else if (isServerCached) { // if server is offline, but we have cached data, we can check if we are logged in

			} else { // if server is offline and we have no cached data, we can't check if we are logged in

			}
		})();
	}, []);

	useEffect(() => {
		//console.log("Check if sync is complete: ")
		const syncComplete = demo || checkSynchedResources()
		//console.log("syncComplete: "+syncComplete);
		if (syncComplete) {
			props.setSyncComplete(true);
		}
	}, itemsToLoad);

	const key = JSON.stringify(synchedResourcesToDownloadFirst);
	return <LoadingScreenDatabase text={'Upload'} nowInMs={nowInMs} key={key} synchedResources={synchedResourcesToDownloadFirst} />
}

export const RootSyncDatabaseUpload = (props: RootAuthUserFlowLoaderProps) => {
	const isServerOffline = useIsServerOffline()

	const syncForUserId = props.syncForUserId;
	const [synchedForUserId, setSynchedForUserId] = useState<any>({
		userId: false
	});
	const setSyncComplete = (bool: boolean) => {
		setSynchedForUserId({
			userId: syncForUserId
		})
	}

	const syncComplete = synchedForUserId.userId === syncForUserId;

	if (isServerOffline) {
		return <PleaseConnectFirstTimeWithInternet />
	}

	if (!syncComplete) {
		return <RootSyncDatabaseUploadInner setSyncComplete={setSyncComplete} />
	}

	return (
		props.children
	)
}