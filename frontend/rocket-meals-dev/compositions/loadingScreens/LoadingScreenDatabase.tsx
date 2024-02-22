import React, {FunctionComponent} from "react";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {Text, View} from "@/components/Themed";
import * as rocketSource from "@/assets/animations/rocket_purple.json";
import {MyProjectColoredLottieAnimation} from "@/components/lottie/MyProjectColoredLottieAnimation";

interface AppState {
    children?: React.ReactNode;
    nowInMs: number
    synchedResources: {[key: string]: {data: any, lastUpdate: number | undefined}}
}
export const LoadingScreenDatabase: FunctionComponent<AppState> = ({children, nowInMs, synchedResources, ...props}) => {



    let synchedResourcesDataSynchedDict: {[key: string]: any}
        = {}
    let synchedResourceKeys = Object.keys(synchedResources)
    let firstResourceKeyNotSynched = undefined
    let allResourcesSynched = true
    for(let i = 0; i < synchedResourceKeys.length; i++){
        let synchedResourceKey = synchedResourceKeys[i]
        let synchedResourceInformation = synchedResources[synchedResourceKey]
        let synchedResource = synchedResourceInformation?.data
        let lastUpdate = synchedResourceInformation?.lastUpdate

        let isResourceSynched = false;
        if (lastUpdate != null) {
            isResourceSynched = !!synchedResource && !isNaN(lastUpdate) && lastUpdate === nowInMs
        } else {
            isResourceSynched = false
        }

        if(!isResourceSynched){
            allResourcesSynched = false
        }

        if(!isResourceSynched && firstResourceKeyNotSynched == undefined){
            firstResourceKeyNotSynched = synchedResourceKey
            break;
        }

        synchedResourcesDataSynchedDict[synchedResourceKey] = {
            data: !!synchedResource,
            lastUpdate: lastUpdate
        }
    }

    let message = "Loading resources"

    let content = null
    if(!allResourcesSynched){
        content = <>
                <Text>{"Loading resource:"}</Text>
            <Text>{firstResourceKeyNotSynched}</Text>
            </>
    } else {
        content = <>
            <Text>{"All resources loaded"}</Text>
        </>
    }

  return (
      <MySafeAreaView>
          <View style={{
                  width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center"
          }}>
              <MyProjectColoredLottieAnimation source={rocketSource} accessibilityLabel={"Test Rocket Colored"} style={{width: 200, height: 200}}/>
              {content}
              {children}
          </View>

      </MySafeAreaView>
  );
}
