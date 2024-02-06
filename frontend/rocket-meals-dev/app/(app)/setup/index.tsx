import {SafeAreaView, ScrollView} from 'react-native';
import {Text, View} from '@/components/Themed';
import React, {useEffect} from "react";
import {
    useIsProfileSetupComplete,
    useSynchedProfileCanteen
} from "@/helper/sync_state_helper/custom_sync_states/SynchedProfile";
import {useSynchedCanteensDict} from "@/helper/sync_state_helper/custom_sync_states/SynchedCanteens";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {DirectusImage} from "@/components/project/DirectusImage";
import {MyCardWithText} from "@/components/card/MyCardWithText";
import {router} from "expo-router";

export default function SettingsScreen() {

    const isProfileSetupComplete = useIsProfileSetupComplete();
  const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
  const [canteenDict, setCanteenDict] = useSynchedCanteensDict();

  let renderCanteens = []
  if(canteenDict){
    let canteen_keys = Object.keys(canteenDict);
    for(let i=0; i<canteen_keys.length; i++){
      let canteen_key = canteen_keys[i];
      let canteen = canteenDict[canteen_key]
      let canteen_label = canteen.label || canteen_key

      const onPress = () => {
        console.log("onPress:")
        console.log(canteen);
        setProfileCanteen(canteen);
      }

      let renderedImage = (
          <MyTouchableOpacity accessibilityLabel={canteen_label} onPress={onPress} >
            <DirectusImage assetId={canteen?.image} thumbHash={canteen?.thumbHash} style={{width: "100%", height: 400}} />
          </MyTouchableOpacity>
      )

      renderCanteens.push(
          <View style={{width: 500, height: 500, padding: 10, borderWidth: 1, borderColor: "orange"}}>
            <MyCardWithText topComponent={renderedImage} heading={canteen_label} text={""} onPress={onPress} style={{width: 500, height: "100%"}}>
            </MyCardWithText>
          </View>
      )
    }
  }

    useEffect(() => {
        if(isProfileSetupComplete){
            router.navigate("/(app)/home");
        }
    }, [isProfileSetupComplete]);

  return (
     <SafeAreaView style={{width: "100%", height: "100%"}}>
       <ScrollView style={{width: "100%", height: "100%"}}>
           {renderCanteens}
         <Text>{"profileCanteen:"}</Text>
         <Text>{JSON.stringify(profileCanteen, null, 2)}</Text>
       </ScrollView>
     </SafeAreaView>
  );
}
