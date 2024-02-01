import {ScrollView, StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {MyCard} from "@/components/card/MyCard";
import {useSynchedCanteens} from "@/helper/sync_state_helper/custom_sync_states/SynchedCanteens";
import {DirectusImage} from "@/components/project/DirectusImage";
import {useSynchedFoods} from "@/helper/sync_state_helper/custom_sync_states/SynchedFoods";

export default function HomeScreen() {
  const [resources, setResources, lastUpdate] = useSynchedFoods();

  let renderCanteens = []
  if(resources){
    for (const [key, value] of Object.entries(resources)) {
      let renderedImage = <DirectusImage assetId={value.image} thumbHash={value?.thumbHash} style={{width: "100%", height: 300}} />

      renderCanteens.push(
        <View style={{width: 500, height: 500, padding: 10, backgroundColor: "orange"}}>
          <MyCard topComponent={renderedImage} accessibilityLabel={value.alias || key} heading={value.alias} text={value.image} date={value.date_updated} onPress={() => {}} style={{width: 500, height: "100%"}}>

          </MyCard>
        </View>
      )
    }

}
  return (
    <View style={{width: "100%", height: "100%", backgroundColor: "red"}}>
      <ScrollView style={{width: "100%", height: "100%", backgroundColor: "blue"}}>
        {renderCanteens}
        <Text>{JSON.stringify(resources, null, 2)}</Text>
      </ScrollView>
    </View>
  );
}
