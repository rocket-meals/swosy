import {DependencyList, useEffect, useState} from 'react';
import {useIsServerCached, useIsServerOffline, useIsServerOnline, useServerInfoRaw} from '@/states/SyncStateServerInfo';
import {useIsDemo} from '@/states/SynchedDemo';
import {useSynchedAppSettings} from '@/states/SynchedAppSettings';
import {useSynchedCollectionsDatesLastUpdateDict} from '@/states/SynchedCollectionsLastUpdate';
import {LoadingScreenDatabase} from '@/compositions/loadingScreens/LoadingScreenDatabase';
import {PleaseConnectFirstTimeWithInternet} from '@/compositions/loadingScreens/PleaseConnectFirstTimeWithInternet';
import {View, Text, Heading} from '../Themed';
import {MyButton} from "@/components/buttons/MyButton";
import {AnimationUnderConstruction} from "@/compositions/animations/AnimationUnderConstruction";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DateHelper} from "@/helper/date/DateHelper";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

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

export const RootSyncSettingsDownloadInner = (props: RootAuthUserFlowLoaderInnerProps) => {
	const isServerOnline = useIsServerOnline()
	const isServerCached = useIsServerCached();

	const demo = useIsDemo()
	const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());
	const nowAsKey = nowInMs.toString();

	const registeredItemsToLoad: any[] = [];

	const [app_settings, setAppSettings, cacheHelperObjAppSettings] = useSynchedAppSettings()
	const [collectionsDatesLastUpdate, setCollectionsDatesLastUpdateDict, cacheHelperObjCollectionDatesLastUpdate] = useSynchedCollectionsDatesLastUpdateDict()

	const synchedResourcesToDownloadFirst: {[key: string]: {data: any, lastUpdate: string | undefined}} = {}


	console.log("1_collectionsDatesLastUpdate: ",collectionsDatesLastUpdate);
	console.log(collectionsDatesLastUpdate);
	function addSynchedResourceToDownloadFirst(label: string, resource: any, lastUpdate: string | undefined) {


		registeredItemsToLoad.push(resource);
		synchedResourcesToDownloadFirst[label] = {
			data: resource,
			lastUpdate: lastUpdate
		}
	}

	/**
   * Needs to be called before the useEffect
   */

	addSynchedResourceToDownloadFirst('app_settings', app_settings, cacheHelperObjAppSettings.sync_cache_composed_key_local)
	addSynchedResourceToDownloadFirst('collectionsDatesLastUpdate', collectionsDatesLastUpdate, cacheHelperObjCollectionDatesLastUpdate.sync_cache_composed_key_local)

	function getDependencies(): DependencyList {
		return registeredItemsToLoad;
	}

	const itemsToLoad = getDependencies();

	function checkSynchedResources() {
		console.log("--- checkSynchedResources ---");
		const synchedResourceKeys = Object.keys(synchedResourcesToDownloadFirst)
		for (let i = 0; i < synchedResourceKeys.length; i++) {
			let isResourceSynched = false;
			const synchedResourceKey = synchedResourceKeys[i]
			const synchedResourceInformation = synchedResourcesToDownloadFirst[synchedResourceKey]
			const synchedResource = synchedResourceInformation?.data
			const synchedResourceLastUpdate = synchedResourceInformation?.lastUpdate
			console.log("synchedResourceKey", synchedResourceKey)
			console.log("synchedResourceInformation: ",synchedResourceInformation);
			if (isServerOnline) { // if server is online, we can check if we are logged in
				console.log("server is online");
				if (synchedResourceLastUpdate != null) {
					console.log("synchedResourceLastUpdate: ",synchedResourceLastUpdate);
					console.log("nowInMs: ",nowAsKey);
					isResourceSynched = !!synchedResource && !!synchedResourceLastUpdate && synchedResourceLastUpdate === nowAsKey
					console.log("isResourceSynched: ",isResourceSynched);
				} else {
					isResourceSynched = false
				}
			} else if (isServerCached) { // if server is offline, but we have cached data, we can check if we are logged in
				console.log("server is cached");
				console.log("synchedResourceLastUpdate: ",synchedResourceLastUpdate);
				console.log("nowInMs: ",nowInMs);
				console.log("synchedResource: ",synchedResource);
				isResourceSynched = !!synchedResource
				console.log("isResourceSynched: ",isResourceSynched);
			}
			if (!isResourceSynched) {
				return false;
			}
		}
		return true
	}

	useEffect(() => {
		(async () => {
			console.log('RootSyncSettingsDownload: useEffect');
			console.log('Is server online: ',isServerOnline);

			if (isServerOnline) { // if server is online, we can check if we are logged in
				if (!demo) {
					// TODO: Improve by running all updates in parallel using Promise.all?
					await cacheHelperObjAppSettings.updateFromServer(nowAsKey)
					await cacheHelperObjCollectionDatesLastUpdate.updateFromServer(nowAsKey)
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
	return <LoadingScreenDatabase text={'Download'} nowInMs={nowInMs} key={key} synchedResources={{}} />
}

// children: React.ReactNode;
const MaintenanceCheckComponent = ({children}: {children: React.ReactNode}) => {
	const [app_settings, setAppSettings, updateAppSettingsFromServer] = useSynchedAppSettings()
	const [serverInfo, setServerInfo] = useServerInfoRaw();
	const isServerCached = useIsServerCached();

	const translation_maintenance = useTranslation(TranslationKeys.maintenance);
	const translation_maintenance_message = useTranslation(TranslationKeys.maintenance_message);
	const translation_maintenance_estimated_end = useTranslation(TranslationKeys.maintenance_estimated_end);
	const translation_use_cached_version = useTranslation(TranslationKeys.use_cached_version);

	const [useCachedData, setUseCachedData] = useState<boolean>(false);

	const maintenance_start_date_string = app_settings?.maintenance_start;
	const maintenance_end_date_string = app_settings?.maintenance_end;

	let maintenance_start_date = undefined;
	let is_valid_start_date = DateHelper.isValidDateString(maintenance_start_date_string);
	if(is_valid_start_date && maintenance_start_date_string){
		maintenance_start_date = new Date(maintenance_start_date_string);
	}

	let maintenance_end_date = undefined;
	let is_valid_end_date = DateHelper.isValidDateString(maintenance_end_date_string);
	if(is_valid_end_date && maintenance_end_date_string){
		maintenance_end_date = new Date(maintenance_end_date_string);
	}

	const now = new Date();

	let maintenance_active = false;
	if(maintenance_start_date){ // if there is a start date, we check if the maintenance is active
		if(now >= maintenance_start_date) {
			maintenance_active = true;
		}
	}
	if(maintenance_end_date){ // if there is an end date, we check if the maintenance is active
		if(now >= maintenance_end_date) {
			maintenance_active = false;
		}
	}

	let content = children;

	if(maintenance_active) {
		if(useCachedData && isServerCached) {
			content = <View style={{width: '100%', height: '100%'}}>
				{children}
			</View>
		} else {
			let estimated_end_message = undefined;
			if(translation_maintenance_estimated_end && maintenance_end_date_string) {
				const maintenance_end_date = new Date(maintenance_end_date_string);
				const maintenance_end_human_readable = DateHelper.formatOfferDateToReadable(maintenance_end_date, true, true);
				estimated_end_message = <Text>{translation_maintenance_estimated_end + ': ' + maintenance_end_human_readable}</Text>
			}

			content = (
				<MySafeAreaView>
					<MyScrollView>
						<View style={{width: '100%', alignItems: 'center'}}>
							<AnimationUnderConstruction />
							<Heading>{translation_maintenance}</Heading>
							<Text>{translation_maintenance_message}</Text>
							{estimated_end_message}
							<View style={{height: 20}}></View>
							<MyButton text={translation_use_cached_version} onPress={() => {
								setUseCachedData(true)
								setServerInfo((currentServerInfo) => {
									if(currentServerInfo) {
										currentServerInfo.status = 'cached'
									}
									return currentServerInfo
								});
							}}  accessibilityLabel={translation_use_cached_version} />

						</View>
					</MyScrollView>
				</MySafeAreaView>
			)
		}
	}


	return content
}

export const RootSyncSettingsDownload = (props: RootAuthUserFlowLoaderProps) => {
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
		return <RootSyncSettingsDownloadInner setSyncComplete={setSyncComplete} />
	}

	// so after the sync is complete, we check if the server is in maintenance mode


	return (
		<MaintenanceCheckComponent>
			{props.children}
		</MaintenanceCheckComponent>
	)
}