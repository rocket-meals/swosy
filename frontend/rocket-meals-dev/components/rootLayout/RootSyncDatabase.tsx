import {DependencyList, useEffect, useState} from 'react';
import {Text} from "@/components/Themed";
import {
  useIsServerCached,
  useIsServerOnline,
  useServerInfo,
  useServerInfoRaw
} from "@/states/SyncStateServerInfo";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {Buildings, Canteens, Foods, Wikis} from "@/helper/database/databaseTypes/types";
import {useSynchedFoods} from "@/states/SynchedFoods";
import {useIsDemo} from "@/states/SynchedDemo";
import {
  getEmptyProfile,
  loadProfileRemote,
  useSynchedProfile
} from "@/states/SynchedProfile";
import {useCurrentUser, useIsCurrentUserAnonymous} from "@/states/User";
import {ScrollView} from "react-native";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {useSynchedWikisDict} from "@/states/SynchedWikis";
import {loadLanguageRemoteDict, useSynchedLanguagesDict} from "@/states/SynchedLanguages";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {useSynchedApartmentsDict} from "@/states/SynchedApartments";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootAuthUserFlowLoaderProps {
  children?: React.ReactNode;
  userId: number | undefined
}

export interface RootAuthUserFlowLoaderInnerProps {
  children?: React.ReactNode;
  setSyncComplete: (finished: boolean) => void
}

export const RootSyncDatabaseInner = (props: RootAuthUserFlowLoaderInnerProps) => {

  //console.log("AuthFlowUserCheck")

  const isServerOnline = useIsServerOnline()
  const isServerCached = useIsServerCached();

  let [currentUser, setUserWithCache] = useCurrentUser();
  const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

  const demo = useIsDemo()
  const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());

  const registeredItemsToLoad: any[] = [];

  const [app_settings, setAppSettings, lastUpdateAppSettings, updateAppSettingsFromServer] = useSynchedAppSettings()

  const [canteensDict, setCanteens, lastUpdateCanteens, updateCanteensFromServer] = useSynchedCanteensDict()
  const [markingsDict, setMarkingsDict, lastUpdateMarkings, updateMarkingsFromServer] = useSynchedMarkingsDict()
  const [buildingsDict, setBuildingsDict, lastUpdateBuildings, updateBuildingsFromServer] = useSynchedBuildingsDict()
  const [languagesDict, setLanguagesDict, lastUpdateLanguages, updateLanguagesFromServer] = useSynchedLanguagesDict()
  const [apartmentsDict, setApartmentsDict, lastUpdateApartments, updateApartmentsFromServer] = useSynchedApartmentsDict()
  const [wikisDict, setWikisDict, lastUpdateWikis, updateWikisFromServer] = useSynchedWikisDict()

  const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()


  let synchedResources: {[key: string]: {data: any, lastUpdate: number | undefined}} = {}

  function addSynchedResource(label: string, resource: any, lastUpdate: number | undefined){
    registeredItemsToLoad.push(resource);
    synchedResources[label] = {
      data: resource,
      lastUpdate: lastUpdate
    }
  }

  /**
   * Needs to be called before the useEffect
   */
  addSynchedResource("app_settings", app_settings, lastUpdateAppSettings)
  addSynchedResource("canteens", canteensDict, lastUpdateCanteens)
  addSynchedResource("buildings", buildingsDict, lastUpdateBuildings)
  addSynchedResource("profile", profile, lastUpdateProfile);
  addSynchedResource("wikis", wikisDict, lastUpdateWikis)
  addSynchedResource("languages", languagesDict, lastUpdateLanguages)
  addSynchedResource("markings", markingsDict, lastUpdateMarkings);
  addSynchedResource("apartments", apartmentsDict, lastUpdateApartments);

  function getDependencies(): DependencyList {
    return registeredItemsToLoad;
  }

  const itemsToLoad = getDependencies();

  function checkSynchedResources(){
    //console.log("--- checkSynchedResources ---");
    let synchedResourceKeys = Object.keys(synchedResources)
    for(let i = 0; i < synchedResourceKeys.length; i++){
      let isResourceSynched = false;
      let synchedResourceKey = synchedResourceKeys[i]
      let synchedResourceInformation = synchedResources[synchedResourceKey]
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
      let remoteProfile = await loadProfileRemote(currentUser)
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
    // call anonymous function
    (async () => {
      //console.log("AuthFlowUserCheck useEffect")
      //console.log("refreshToken", refreshToken)

      if(isServerOnline){ // if server is online, we can check if we are logged in
        if(!demo){
          await updateAppSettingsFromServer(nowInMs)
          await updateCanteensFromServer(nowInMs);
          await updateBuildingsFromServer(nowInMs);
          await updateProfile()
          await updateWikisFromServer(nowInMs)
          await updateLanguagesFromServer(nowInMs)
          await updateMarkingsFromServer(nowInMs)
          await updateApartmentsFromServer(nowInMs)
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

  let synchedResourcesDataSynchedDict: {[key: string]: any}
      = {}
    let synchedResourceKeys = Object.keys(synchedResources)
    for(let i = 0; i < synchedResourceKeys.length; i++){
      let synchedResourceKey = synchedResourceKeys[i]
      let synchedResourceInformation = synchedResources[synchedResourceKey]
      let synchedResource = synchedResourceInformation?.data
      let lastUpdate = synchedResourceInformation?.lastUpdate
        synchedResourcesDataSynchedDict[synchedResourceKey] = {
            data: !!synchedResource,
            lastUpdate: lastUpdate
        }
    }

  return <>
    <ScrollView style={{width: "100%", height: "100%"}}>
      <Text>{"SyncDatabase flow waiting"}</Text>
      <Text>{"nowInMS: "+nowInMs}</Text>
      <Text>{"synchedResourcesDataSynchedDict: "}</Text>
      <Text>{JSON.stringify(synchedResourcesDataSynchedDict, null, 2)}</Text>
    </ScrollView>
  </>
}

export const RootSyncDatabase = (props: RootAuthUserFlowLoaderProps) => {

  const userId = props.userId;
  const [synchedForUserId, setSynchedForUserId] = useState<any>({
    userId: false
  });
  const setSyncComplete = (bool: boolean) => {
    setSynchedForUserId({
      userId: userId
    })
  }

  const syncComplete = synchedForUserId.userId === userId;


  if(!syncComplete){
    return <RootSyncDatabaseInner setSyncComplete={setSyncComplete} />
  }

    return(
        props.children
    )
}