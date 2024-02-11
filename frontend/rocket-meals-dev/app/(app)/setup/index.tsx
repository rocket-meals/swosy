import React, {useEffect} from "react";
import {useIsProfileSetupComplete, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {router} from "expo-router";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {Heading, View} from "@/components/Themed";
import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";

export default function SettingsScreen() {

    const isProfileSetupComplete = useIsProfileSetupComplete();
  const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const onSelectCanteen = (canteen: Canteens) => {
        console.log("onPress:")
        console.log(canteen);
        setProfileCanteen(canteen);
    }

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
             <CanteenGridList onPress={onSelectCanteen} />
         </View>
     </MySafeAreaView>
  );
}
