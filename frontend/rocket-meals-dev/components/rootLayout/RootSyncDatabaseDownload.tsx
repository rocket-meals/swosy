import {DependencyList, useEffect, useState} from 'react';
import {useIsServerCached, useIsServerOffline, useIsServerOnline} from "@/states/SyncStateServerInfo";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {useIsDemo} from "@/states/SynchedDemo";
import {getEmptyProfile, loadProfileRemoteByUser, useSynchedProfile} from "@/states/SynchedProfile";
import {useCurrentUser, useIsCurrentUserAnonymous} from "@/states/User";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {useSynchedWikisDict} from "@/states/SynchedWikis";
import {useSynchedLanguagesDict} from "@/states/SynchedLanguages";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {useSynchedApartmentsDict} from "@/states/SynchedApartments";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {useSynchedCollectionsDatesLastUpdateDict} from "@/states/SynchedCollectionsLastUpdate";
import {useSynchedRolesDict} from "@/states/SynchedRoles";
import {useSynchedPermissionsDict} from "@/states/SynchedPermissions";
import {LoadingScreenDatabase} from "@/compositions/loadingScreens/LoadingScreenDatabase";
import {PleaseConnectFirstTimeWithInternet} from "@/compositions/loadingScreens/PleaseConnectFirstTimeWithInternet";
import {useSynchedNewsDict} from "@/states/SynchedNews";
import {useSynchedDevices} from "@/states/SynchedDevices";
import {useSynchedAppTranslationsDict} from "@/states/SynchedTranslations";

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

  let [currentUser, setUserWithCache] = useCurrentUser();
  const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

  const demo = useIsDemo()
  const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());

  const registeredItemsToLoad: any[] = [];

  const [app_settings, setAppSettings, lastUpdateAppSettings, updateAppSettingsFromServer] = useSynchedAppSettings()
  const [collectionsDatesLastUpdate, setCollectionsDatesLastUpdateDict, lastUpdateCollectionsDates, updateCollectionsDatesFromServer] = useSynchedCollectionsDatesLastUpdateDict()

  const [translationsDict, setTranslationsDict, lastUpdateTranslations, updateTranslationsFromServer] = useSynchedAppTranslationsDict()
  const [canteensDict, setCanteens, lastUpdateCanteens, updateCanteensFromServer] = useSynchedCanteensDict()
  const [markingsDict, setMarkingsDict, lastUpdateMarkings, updateMarkingsFromServer] = useSynchedMarkingsDict()
  const [buildingsDict, setBuildingsDict, lastUpdateBuildings, updateBuildingsFromServer] = useSynchedBuildingsDict()
  const [languagesDict, setLanguagesDict, lastUpdateLanguages, updateLanguagesFromServer] = useSynchedLanguagesDict()
  const [apartmentsDict, setApartmentsDict, lastUpdateApartments, updateApartmentsFromServer] = useSynchedApartmentsDict()
  const [wikisDict, setWikisDict, lastUpdateWikis, updateWikisFromServer] = useSynchedWikisDict()
  const [rolesDict, setRolesDict, lastUpdateRoles, updateRolesFromServer] = useSynchedRolesDict()
  const [newsDict, setNewsDict, lastUpdateNews, updateNewsFromServer] = useSynchedNewsDict()
  const [permissionsDict, setPermissionsDict, lastUpdatePermissions, updatePermissionsFromServer] = useSynchedPermissionsDict()

  const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()

  let synchedResourcesToDownloadFirst: {[key: string]: {data: any, lastUpdate: number | undefined}} = {}

  function addSynchedResourceToDownloadFirst(label: string, resource: any, lastUpdate: number | undefined){
    registeredItemsToLoad.push(resource);
    synchedResourcesToDownloadFirst[label] = {
      data: resource,
      lastUpdate: lastUpdate
    }
  }

  /**
   * Needs to be called before the useEffect
   */

  addSynchedResourceToDownloadFirst("translations", translationsDict, lastUpdateTranslations)
  addSynchedResourceToDownloadFirst("app_settings", app_settings, lastUpdateAppSettings)
  addSynchedResourceToDownloadFirst("canteens", canteensDict, lastUpdateCanteens)
  addSynchedResourceToDownloadFirst("buildings", buildingsDict, lastUpdateBuildings)
  addSynchedResourceToDownloadFirst("profile", profile, lastUpdateProfile);
  addSynchedResourceToDownloadFirst("wikis", wikisDict, lastUpdateWikis)
  addSynchedResourceToDownloadFirst("languages", languagesDict, lastUpdateLanguages)
  addSynchedResourceToDownloadFirst("markings", markingsDict, lastUpdateMarkings);
  addSynchedResourceToDownloadFirst("apartments", apartmentsDict, lastUpdateApartments);
  addSynchedResourceToDownloadFirst("roles", rolesDict, lastUpdateRoles);
  addSynchedResourceToDownloadFirst("permissions", permissionsDict, lastUpdatePermissions);
  addSynchedResourceToDownloadFirst("news", newsDict, lastUpdateNews);

  function getDependencies(): DependencyList {
    return registeredItemsToLoad;
  }

  const itemsToLoad = getDependencies();

  function checkSynchedResources(){
    //console.log("--- checkSynchedResources ---");
    let synchedResourceKeys = Object.keys(synchedResourcesToDownloadFirst)
    for(let i = 0; i < synchedResourceKeys.length; i++){
      let isResourceSynched = false;
      let synchedResourceKey = synchedResourceKeys[i]
      let synchedResourceInformation = synchedResourcesToDownloadFirst[synchedResourceKey]
      let synchedResource = synchedResourceInformation?.data
      let synchedResourceLastUpdate = synchedResourceInformation?.lastUpdate
      //console.log("synchedResourceKey", synchedResourceKey)
      //console.log("synchedResourceInformation: ",synchedResourceInformation);
      if(isServerOnline){ // if server is online, we can check if we are logged in
        //console.log("server is online");
        if (synchedResourceLastUpdate != null) {
          isResourceSynched = !!synchedResource && !isNaN(synchedResourceLastUpdate) && synchedResourceLastUpdate === nowInMs
        } else {
          isResourceSynched = false
        }
      } else if (isServerCached) { // if server is offline, but we have cached data, we can check if we are logged in
        isResourceSynched = !!synchedResource
      }
      if(!isResourceSynched){
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

  async function updateProfile(){
    console.log("RootSyncDatabase: Update profile");
    console.log("RootSyncDatabase: Update profile - isCurrentUserAnonymous: ",isCurrentUserAnonymous);
    if(!isCurrentUserAnonymous){
      console.log("RootSyncDatabase: Update profile - loadProfileRemote: ");
      let remoteProfile = await loadProfileRemoteByUser(currentUser)
      console.log("RootSyncDatabase: Update profile - remoteProfile: ",remoteProfile);
      if(!!remoteProfile){
        setProfile(remoteProfile, nowInMs);
      }
    } else {
      if(!!profile && JSON.stringify(profile) !== JSON.stringify({})){
        setProfile(profile, nowInMs)
      } else {
        setProfile(getEmptyProfile(), nowInMs)
      }
    }
  }

  useEffect(() => {
    (async () => {
      console.log("RootSyncDatabase: useEffect");
      console.log("Is server online: ",isServerOnline);

      if(isServerOnline){ // if server is online, we can check if we are logged in
        if(!demo){
          // TODO: Improve by running all updates in parallel using Promise.all?
          await updateTranslationsFromServer(nowInMs)
          await updateAppSettingsFromServer(nowInMs)
          await updateCanteensFromServer(nowInMs);
          await updateBuildingsFromServer(nowInMs);
          await updateProfile()
          await updateWikisFromServer(nowInMs)
          await updateLanguagesFromServer(nowInMs)
          await updateMarkingsFromServer(nowInMs)
          await updateApartmentsFromServer(nowInMs)
          await updateRolesFromServer(nowInMs)
          await updatePermissionsFromServer(nowInMs)
          await updateNewsFromServer(nowInMs)
        }
      } else if (isServerCached) { // if server is offline, but we have cached data, we can check if we are logged in

      } else { // if server is offline and we have no cached data, we can't check if we are logged in

      }
    })();
  }, []);

  useEffect(() => {
    //console.log("Check if sync is complete: ")
    let syncComplete = demo || checkSynchedResources()
    //console.log("syncComplete: "+syncComplete);
    if(syncComplete){
      props.setSyncComplete(true);
    }
  }, itemsToLoad);

  let key = JSON.stringify(synchedResourcesToDownloadFirst);
  return <LoadingScreenDatabase text={"Download"} nowInMs={nowInMs} key={key} synchedResources={synchedResourcesToDownloadFirst} />
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

  if(isServerOffline){
    return <PleaseConnectFirstTimeWithInternet />
  }

  if(!syncComplete){
    return <RootSyncDatabaseDownloadInner setSyncComplete={setSyncComplete} />
  }

    return(
        props.children
    )
}