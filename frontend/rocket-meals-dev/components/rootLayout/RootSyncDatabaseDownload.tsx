import {DependencyList, useEffect, useState} from 'react';
import {useIsServerCached, useIsServerOffline, useIsServerOnline} from '@/states/SyncStateServerInfo';
import {useSynchedCanteensDict} from '@/states/SynchedCanteens';
import {useIsDemo} from '@/states/SynchedDemo';
import {useSynchedProfile} from '@/states/SynchedProfile';
import {useSynchedBuildingsDict} from '@/states/SynchedBuildings';
import {useSynchedWikisDict} from '@/states/SynchedWikis';
import {useSynchedLanguagesDict} from '@/states/SynchedLanguages';
import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import {useSynchedApartmentsDict} from '@/states/SynchedApartments';
import {useSynchedCollectionsDatesLastUpdateDict} from '@/states/SynchedCollectionsLastUpdate';
import {useSynchedRolesDict} from '@/states/SynchedRoles';
import {useSynchedPermissionsDict} from '@/states/SynchedPermissions';
import {LoadingScreenDatabase} from '@/compositions/loadingScreens/LoadingScreenDatabase';
import {PleaseConnectFirstTimeWithInternet} from '@/compositions/loadingScreens/PleaseConnectFirstTimeWithInternet';
import {useSynchedNewsDict} from '@/states/SynchedNews';
import {useSynchedAppTranslationsDict} from '@/states/SynchedTranslations';
import {useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {useSynchedFoodsFeedbacksLabelsDict} from "@/states/SynchedFoodsFeedbacksLabels";
import {useSynchedOwnFoodIdToFoodFeedbacksDict} from "@/states/SynchedFoodFeedbacks";
import {getSyncCacheComposedKey, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {CollectionsDatesLastUpdate} from "@/helper/database/databaseTypes/types";
import {Text} from "@/components/Themed";
import {RootTranslationKey, useRootTranslation} from "@/helper/translations/RootTranslation";
import {LoadingScreenTextInformationWrapper} from "@/compositions/loadingScreens/LoadingScreen";

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

export const RootSyncDatabaseDownloadInner = (props: RootAuthUserFlowLoaderInnerProps) => {
	//console.log("AuthFlowUserCheck")

	const isServerOnline = useIsServerOnline()
	const isServerCached = useIsServerCached();

	const translation_sync_database = useRootTranslation(RootTranslationKey.SYNC_DATABASE)

	const demo = useIsDemo()

	const [startSyncTimeRequest, setStartSyncTimeRequest] = useState<string>(new Date().getTime().toString());
	const [collectionsDatesLastUpdateDict, setCollectionsDatesLastUpdateDict, cacheHelperLastUpdateDict] = useSynchedCollectionsDatesLastUpdateDict()

	const [translationsDict, setTranslationsDict, cacheHelperObjTranslations] = useSynchedAppTranslationsDict()
	const [canteensDict, setCanteens, cacheHelperObjCanteens] = useSynchedCanteensDict()
	const [businesshoursDict, setBusinesshoursDict, cacheHelperObjBusinesshours] = useSynchedBusinesshoursDict()
	const [markingsDict, setMarkingsDict, cacheHelperObjMarkings] = useSynchedMarkingsDict()
	const [buildingsDict, setBuildingsDict, cacheHelperObjBuildings] = useSynchedBuildingsDict()
	const [foodsFeedbacksLabelsDict, setFoodsFeedbacksLabelsDict, cacheHelperFoodsFeedbacksLabels] = useSynchedFoodsFeedbacksLabelsDict()
	const [ownFoodFeedbacksDict, setOwnFoodFeedbacksDict, cacheHelperObjOwnFoodFeedbacks] = useSynchedOwnFoodIdToFoodFeedbacksDict()
	const [languagesDict, setLanguagesDict, cacheHelperObjLanguages] = useSynchedLanguagesDict()
	const [apartmentsDict, setApartmentsDict, cacheHelperObjApartments] = useSynchedApartmentsDict()
	const [wikisDict, setWikisDict, cacheHelperObjWikis] = useSynchedWikisDict()
	const [rolesDict, setRolesDict, cacheHelperObjRoles] = useSynchedRolesDict()
	const [newsDict, setNewsDict, cacheHelperObjNews] = useSynchedNewsDict()
	const [permissionsDict, setPermissionsDict, cacheHelperObjPermissions] = useSynchedPermissionsDict()
	const [profile, setProfile, cacheHelperObjProfile] = useSynchedProfile()

	// SYNC STATE PER RESOURCE
	// current_version
	// desired_version
	// is_version_up_to_date
	// cacheHelperObj

	const synchedResourcesToDownloadFirst: {[key: string]: SyncResourceType} = {}

	type SyncResourceType = {
		key: string,
		data: any,
		version_current: string | undefined,
		version_desired: string | undefined,
		is_version_up_to_date?: boolean,
		cacheHelperObj: MyCacheHelperType,
	}

	function addResourceToCheckForUpdates(key: string, resource: any, cacheHelperObj: MyCacheHelperType){
		//console.log("-----")
		//console.log("addResourceToCheckForUpdates: "+label)
		let desiredVersion = getDesiredVersion(resource, cacheHelperObj, collectionsDatesLastUpdateDict)
		//console.log("desiredVersion: "+desiredVersion)
		let currentVersion = cacheHelperObj.sync_cache_composed_key_local
		//console.log("currentVersion: "+currentVersion)
		//console.log("-----")

		synchedResourcesToDownloadFirst[key] = {
			key: key,
			data: resource,
			version_current: currentVersion,
			version_desired: desiredVersion,
			is_version_up_to_date: currentVersion === desiredVersion,
			cacheHelperObj: cacheHelperObj,
		}
	}

	/**
   * Needs to be called before the useEffect
   */
	addResourceToCheckForUpdates('translations', translationsDict, cacheHelperObjTranslations)
	addResourceToCheckForUpdates('canteens', canteensDict, cacheHelperObjCanteens)
	addResourceToCheckForUpdates('businesshours', businesshoursDict, cacheHelperObjBusinesshours)
	addResourceToCheckForUpdates('buildings', buildingsDict, cacheHelperObjBuildings)
	addResourceToCheckForUpdates('foodsFeedbacksLabels', foodsFeedbacksLabelsDict, cacheHelperFoodsFeedbacksLabels)
	addResourceToCheckForUpdates('profile', profile, cacheHelperObjProfile);
	addResourceToCheckForUpdates('wikis', wikisDict, cacheHelperObjWikis)
	addResourceToCheckForUpdates('ownFoodFeedbacks', ownFoodFeedbacksDict, cacheHelperObjOwnFoodFeedbacks)
	addResourceToCheckForUpdates('languages', languagesDict, cacheHelperObjLanguages)
	addResourceToCheckForUpdates('markings', markingsDict, cacheHelperObjMarkings);
	addResourceToCheckForUpdates('apartments', apartmentsDict, cacheHelperObjApartments);
	addResourceToCheckForUpdates('roles', rolesDict, cacheHelperObjRoles);
	addResourceToCheckForUpdates('permissions', permissionsDict, cacheHelperObjPermissions);
	addResourceToCheckForUpdates('news', newsDict, cacheHelperObjNews);

	function getDependencies(): DependencyList {
		const dependencies: string[] = [];
		for (let key in synchedResourcesToDownloadFirst) {
			let resource = synchedResourcesToDownloadFirst[key];
			let version_current = resource.version_current;
			let version_desired = resource.version_desired;
			let dependencyoObj = {
				key: key,
				version_current: version_current,
				version_desired: version_desired
			}
			const dependencyKey = JSON.stringify(dependencyoObj, null, 2);
			dependencies.push(dependencyKey);
		}
		return dependencies;
	}

	const dependenciesToRecheckSyncStatus = getDependencies();

	function getDesiredVersion(resourceLocal: any, cacheHelperObj: MyCacheHelperType, collectionsDatesLastUpdateDict: Record<string, CollectionsDatesLastUpdate | null | undefined> | null | undefined): string | undefined
	{
		//console.log("getDesiredVersion")
		if (isServerOnline) { // if server is online
			//console.log("isServerOnline")
			const download_always = cacheHelperObj.dependencies.update_always;
			//console.log("download_always: "+download_always)
			if(download_always){
				// we should use as composed key the request time as we cant rely on the composed key which is created by the dependencies
				return startSyncTimeRequest;
			} else {
				//console.log("not download_always")
				const isCollectionDatesLadUpdateDictCached = !!collectionsDatesLastUpdateDict
				//console.log("isCollectionDatesLadUpdateDictCached: "+isCollectionDatesLadUpdateDictCached)
				if(isCollectionDatesLadUpdateDictCached){
					let composedKey = getSyncCacheComposedKey(cacheHelperObj, collectionsDatesLastUpdateDict);
					//console.log("composedKey: "+composedKey)
					if(composedKey instanceof Error){
						// one of the collections is not found in the collectionsDatesLastUpdateDict
						return startSyncTimeRequest // tell them to download it just, as we dont know the version and we are online
					} else {
						return composedKey
					}
				} else {
					// at this moment somethings wrong, we should have the collection dates last update dict cached from the previous screen
					return undefined
				}
			}
		} else if (isServerCached) {
			const isResourceDataCached = !!resourceLocal;
			if(isResourceDataCached){ // resource is synched when we have a cached version when server is offline
				return cacheHelperObj.sync_cache_composed_key_local // therefore we can use the local composed key
			} else {
				return undefined // we dont have a local version, so we need to download it
			}
		} else {
			return undefined // we dont have a local version, so we need to download it
		}
	}

	function isSyncComplete() {
		for (let key in synchedResourcesToDownloadFirst) {
			let resource = synchedResourcesToDownloadFirst[key];
			if (!resource.is_version_up_to_date) {
				return false;
			}
		}
		return true;
	}

	function getAllUnsyncedResources(): SyncResourceType[] {
		let unsyncedResources: SyncResourceType[] = [];
		for (let key in synchedResourcesToDownloadFirst) {
			let resource = synchedResourcesToDownloadFirst[key];
			if (!resource.is_version_up_to_date) {
				unsyncedResources.push(resource);
			}
		}
		return unsyncedResources;
	}

	function getNextResourceToDownload(): SyncResourceType | undefined {
		let unsyncedResources = getAllUnsyncedResources();
		if (unsyncedResources.length > 0) {
			return unsyncedResources[0];
		}
		return undefined;
	}

	useEffect(() => {
		(async () => {
			console.log('RootSyncDatabase: useEffect');

		})();
	}, []);

	async function handleUpdateFromServer(cacheHelperObj: MyCacheHelperType, version_desired: string | undefined) {
		const simulateSlowDownload = false;
		if (simulateSlowDownload){
			await new Promise(r => setTimeout(r, 1000));
		}

		await cacheHelperObj.updateFromServer(version_desired);
		// small delay to make sure the server has time to update the data
	}

	useEffect(() => {
		//console.log("Check if sync is complete: ")
		const syncComplete = demo || isSyncComplete()
		//console.log("syncComplete: "+syncComplete);
		if (syncComplete) {
			props.setSyncComplete(true);
		} else {
			const nextResourceToDownload = getNextResourceToDownload();
			if (nextResourceToDownload) {
				const cacheHelperObj = nextResourceToDownload.cacheHelperObj;
				const version_desired = nextResourceToDownload.version_desired;
				console.log("Next resource to download: "+nextResourceToDownload.key)
				handleUpdateFromServer(cacheHelperObj, version_desired);
			}

		}
	}, dependenciesToRecheckSyncStatus);

	let renderedTexts: any[] = [];
	for (let key in synchedResourcesToDownloadFirst) {
		let resource = synchedResourcesToDownloadFirst[key];
		let version_current = resource.version_current;
		let version_desired = resource.version_desired;
		let dependencyoObj = {
			key: key,
			version_current: version_current,
			version_desired: version_desired
		}
		const dependencyKey = JSON.stringify(dependencyoObj, null, 2);
		renderedTexts.push(<Text>{dependencyKey}</Text>)
	}

	const nextResourceToDownload = getNextResourceToDownload();

	return <LoadingScreenDatabase text={translation_sync_database} nowInMs={0} synchedResources={{}}>
		<Text>{nextResourceToDownload?.key}</Text>
		<Text>{"is_version_up_to_date: "+nextResourceToDownload?.is_version_up_to_date}</Text>
		<Text>{"version_desired: "+nextResourceToDownload?.version_desired}</Text>
		<Text>{"version_current: "+nextResourceToDownload?.version_current}</Text>
	</LoadingScreenDatabase>
}

export const RootSyncDatabaseDownload = (props: RootAuthUserFlowLoaderProps) => {
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
		return <RootSyncDatabaseDownloadInner setSyncComplete={setSyncComplete} />
	}

	return (
		props.children
	)
}