import React, {useEffect} from "react";
import {useIsProfileSetupComplete} from "@/states/SynchedProfile";
import {router} from "expo-router";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {Heading, View} from "@/components/Themed";
import {CanteenSelectGridList} from "@/compositions/resourceGridList/canteenSelectGridList";

export default function SettingsScreen() {

    const isProfileSetupComplete = useIsProfileSetupComplete();

    useEffect(() => {
        if(isProfileSetupComplete){
            router.navigate("/(app)/home");
        }
    }, [isProfileSetupComplete]);

  return (
     <MySafeAreaView>
        <Heading>{"Canteens"}</Heading>
         <View style={{
             width: "100%",
             height: "100%",
             flex: 1,
         }}>
             <CanteenSelectGridList />
         </View>
     </MySafeAreaView>
  );
}
