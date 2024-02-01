import {ScrollView, StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {MyCard} from "@/components/card/MyCard";
import {useSynchedCanteens} from "@/helper/sync_state_helper/custom_sync_states/SynchedCanteens";
import {DirectusImage} from "@/components/project/DirectusImage";
import {useSynchedFoods} from "@/helper/sync_state_helper/custom_sync_states/SynchedFoods";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {MyCardWithText} from "@/components/card/MyCardWithText";

export default function HomeScreen() {
  const [resources, setResources, lastUpdate] = useSynchedFoods();

  let renderCanteens = []
  if(resources){
    for (const [key, value] of Object.entries(resources)) {
      let renderedImage =
          <MyTouchableOpacity accessibilityLabel={value.alias || key} onPress={() => {}} >
          <DirectusImage assetId={value.image} thumbHash={value?.thumbHash} style={{width: "100%", height: 200}} />
        </MyTouchableOpacity>

      renderCanteens.push(
        <View style={{width: 500, height: 500, padding: 10, borderWidth: 1, borderColor: "orange"}}>
          <MyCardWithText topComponent={renderedImage} heading={value.alias} text={value.image} onPress={() => {}} style={{width: 500, height: "100%"}}>

          </MyCardWithText>
        </View>
      )
    }

}
  return (
    <View style={{width: "100%", height: "100%"}}>
      <ScrollView style={{width: "100%", height: "100%"}}>
        {renderCanteens}
        <Text>{JSON.stringify(resources, null, 2)}</Text>
      </ScrollView>
    </View>
  );
}
