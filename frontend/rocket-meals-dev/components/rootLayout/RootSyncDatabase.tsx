import {useEffect, useState} from 'react';
import {Text} from "@/components/Themed";
import {useServerInfoRaw} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {useSynchedCanteens} from "@/helper/sync_state_helper/custom_sync_states/SynchedCanteens";
import {CollectionHelper} from "@/helper/database_helper/server/CollectionHelper";
import {Canteens} from "@/helper/database_helper/databaseTypes/types";

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
  let syncComplete = false;

  let canteensCollectionHelper = new CollectionHelper<Canteens>("canteens");
  const [resources, setResources, lastUpdateCanteens] = useSynchedCanteens()
  let canteensSynced = false

  if(serverInfo?.status === "online"){ // if server is online, we can check if we are logged in
    console.log("lastUpdateCanteens", lastUpdateCanteens)
    canteensSynced = !!lastUpdateCanteens && !isNaN(lastUpdateCanteens) && lastUpdateCanteens === nowInMs
  } else if (serverInfo?.status === "cached") { // if server is offline, but we have cached data, we can check if we are logged in
    canteensSynced = !!resources
  }

  if(canteensSynced){
      syncComplete = true
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
    setResources(canteensDict, nowInMs);
  }

  useEffect(() => {
    // call anonymous function
    (async () => {
      //console.log("AuthFlowUserCheck useEffect")
      //console.log("refreshToken", refreshToken)

      if(serverInfo?.status === "online"){ // if server is online, we can check if we are logged in
        await updateCanteens()
      } else if (serverInfo?.status === "cached") { // if server is offline, but we have cached data, we can check if we are logged in

      } else { // if server is offline and we have no cached data, we can't check if we are logged in

      }
    })();
  }, []);

  if(!syncComplete){
    //console.log("AuthFlowUserCheck useEffect currentUserRaw is null")
    return <>
      <Text>{"SyncDatabase flow waiting"}</Text>
      <Text>{"canteensSynced: "+canteensSynced}</Text>
      <Text>{"lastUpdateCanteens: "+lastUpdateCanteens}</Text>
      <Text>{"nowInMS: "+nowInMs}</Text>
    </>
  }

    return(
        props.children
    )
}