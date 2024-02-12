import {useEffect, useState} from 'react';
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

  let canteensCollectionHelper = new CollectionHelper<Canteens>("canteens");
  const [canteens, setCanteens, lastUpdateCanteens] = useSynchedCanteensDict()

  let buildingsCollectionHelper = new CollectionHelper<Buildings>("buildings");
  const [buildings, setBuildings, lastUpdateBuildings] = useSynchedBuildingsDict()

  let wikisCollectionHelper = new CollectionHelper<Wikis>("wikis");
  const [wikis, setWikis, lastUpdateWikis] = useSynchedWikisDict()

  const foodsCollectionHelper = new CollectionHelper<Foods>("foods");
  const [foods, setFoods, lastUpdateFoods] = useSynchedFoods()

  const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()


  let synchedResources: {[key: string]: {data: any, lastUpdate: number | undefined}} = {}

  function addSynchedResource(label: string, resource: any, lastUpdate: number | undefined){
    synchedResources[label] = {
      data: resource,
      lastUpdate: lastUpdate
    }
  }

  addSynchedResource("canteens", canteens, lastUpdateCanteens)
  addSynchedResource("buildings", buildings, lastUpdateBuildings)
  addSynchedResource("foods", foods, lastUpdateFoods)
  addSynchedResource("profile", profile, lastUpdateProfile);
  const itemsToLoad = [canteens, profile, foods, wikis];

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

  async function updateCanteens(){
    //console.log("updateCanteens")
    let canteensList = await canteensCollectionHelper.readItems()
    //console.log("canteensList", canteensList)
    let canteensDict = canteensCollectionHelper.convertListToDict(canteensList, "id")
    //console.log("canteensDict", canteensDict)
    //await wait(2000)
    setCanteens(canteensDict, nowInMs);
  }

  async function updateWikis(){
    let wikisList = await wikisCollectionHelper.readItems(CollectionHelper.getQueryWithRelatedFieldsAndTranslations())
    let wikisDict = wikisCollectionHelper.convertListToDict(wikisList, "id")
    setWikis(wikisDict, nowInMs)
  }

  async function updateBuildings(){
    let buildingsList = await buildingsCollectionHelper.readItems();
    let buildingsDict = buildingsCollectionHelper.convertListToDict(buildingsList, "id")
    setBuildings(buildingsDict, nowInMs)
  }

  async function updateFoods(){
    //console.log("updateFoods")
    let foodsList = await foodsCollectionHelper.readItems()
    //console.log("foodsList", foodsList)
    let foodsDict = foodsCollectionHelper.convertListToDict(foodsList, "id")
    //console.log("foodsDict", foodsDict)
    //await wait(2000)
    setFoods(foodsDict, nowInMs);
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
          await updateCanteens()
          await updateBuildings();
          await updateFoods()
          await updateProfile()
          await updateWikis()
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

  return <>
    <ScrollView style={{width: "100%", height: "100%"}}>
      <Text>{"SyncDatabase flow waiting"}</Text>
      <Text>{"nowInMS: "+nowInMs}</Text>
      <Text>{"synchedResources: "}</Text>
      <Text>{JSON.stringify(synchedResources, null, 2)}</Text>
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