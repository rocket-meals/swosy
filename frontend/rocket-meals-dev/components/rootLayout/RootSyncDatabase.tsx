import {useEffect, useState} from 'react';
import {Text} from "@/components/Themed";
import {useServerInfoRaw} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {useSynchedCanteens} from "@/helper/sync_state_helper/custom_sync_states/SynchedCanteens";
import {CollectionHelper} from "@/helper/database_helper/server/CollectionHelper";
import {Canteens, Foods} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedFoods} from "@/helper/sync_state_helper/custom_sync_states/SynchedFoods";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootAuthUserFlowLoaderProps {
    children?: React.ReactNode;
}
export const RootSyncDatabase = (props: RootAuthUserFlowLoaderProps) => {

  //console.log("AuthFlowUserCheck")

  const [serverInfo, setServerInfo] = useServerInfoRaw();
  const [nowInMs, setNowInMs] = useState<number>(new Date().getTime());

  let canteensCollectionHelper = new CollectionHelper<Canteens>("canteens");
  const [canteens, setCanteens, lastUpdateCanteens] = useSynchedCanteens()

  const foodsCollectionHelper = new CollectionHelper<Foods>("foods");
  const [foods, setFoods, lastUpdateFoods] = useSynchedFoods()


  let synchedResources: {[key: string]: {data: any, lastUpdate: number | undefined}} = {}

  function addSynchedResource(label: string, resource: any, lastUpdate: number | undefined){
    synchedResources[label] = {
      data: resource,
      lastUpdate: lastUpdate
    }
  }

  addSynchedResource("canteens", canteens, lastUpdateCanteens)
  addSynchedResource("foods", foods, lastUpdateFoods)

  let syncComplete = checkSynchedResources()

  function checkSynchedResources(){
    let synchedResourceKeys = Object.keys(synchedResources)
    for(let i = 0; i < synchedResourceKeys.length; i++){
      let isResourceSynched = false;
      let synchedResourceKey = synchedResourceKeys[i]
      let synchedResourceInformation = synchedResources[synchedResourceKey]
      let synchedResource = synchedResourceInformation.data
      let synchedResourceLastUpdate = synchedResourceInformation.lastUpdate
      console.log("synchedResource", synchedResourceKey)
      if(serverInfo?.status === "online"){ // if server is online, we can check if we are logged in
        if (synchedResourceLastUpdate != null) {
          isResourceSynched = !!synchedResource && !isNaN(synchedResourceLastUpdate) && synchedResourceLastUpdate === nowInMs
        } else {
          isResourceSynched = false
        }
      } else if (serverInfo?.status === "cached") { // if server is offline, but we have cached data, we can check if we are logged in
        isResourceSynched = !!synchedResource
      }
      if(!isResourceSynched){
          false;
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
    console.log("updateCanteens")
    let canteensList = await canteensCollectionHelper.readItems()
    console.log("canteensList", canteensList)
    let canteensDict = canteensCollectionHelper.convertListToDict(canteensList, "id")
    console.log("canteensDict", canteensDict)
    //await wait(2000)
    setCanteens(canteensDict, nowInMs);
  }

  async function updateFoods(){
    console.log("updateFoods")
    let foodsList = await foodsCollectionHelper.readItems()
    console.log("foodsList", foodsList)
    let foodsDict = foodsCollectionHelper.convertListToDict(foodsList, "id")
    console.log("foodsDict", foodsDict)
    //await wait(2000)
    setFoods(foodsDict, nowInMs);
  }

  useEffect(() => {
    // call anonymous function
    (async () => {
      //console.log("AuthFlowUserCheck useEffect")
      //console.log("refreshToken", refreshToken)

      if(serverInfo?.status === "online"){ // if server is online, we can check if we are logged in
        await updateCanteens()
        await updateFoods()
      } else if (serverInfo?.status === "cached") { // if server is offline, but we have cached data, we can check if we are logged in

      } else { // if server is offline and we have no cached data, we can't check if we are logged in

      }
    })();
  }, []);

  if(!syncComplete){
    //console.log("AuthFlowUserCheck useEffect currentUserRaw is null")
    return <>
      <Text>{"SyncDatabase flow waiting"}</Text>
      <Text>{"nowInMS: "+nowInMs}</Text>
      <Text>{"synchedResources: "}</Text>
      <Text>{JSON.stringify(synchedResources, null, 2)}</Text>
    </>
  }

    return(
        props.children
    )
}