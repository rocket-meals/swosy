import {Text, View} from '@/components/Themed';
import {useSynchedFoods} from "@/states/SynchedFoods";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export default function HomeScreen() {
  const [resources, setResources, lastUpdate] = useSynchedFoods();

  let renderCanteens = []

  if(resources){
    for (const [key, value] of Object.entries(resources)) {
        let label = value.alias || key
        let accessibilityLabel = label
        let assetId = value.image;
        let thumbHash = value?.thumbHash;


      renderCanteens.push(
          <MyCardForResourcesWithImage style={{width: 500, height: 500, padding: 10, borderColor: "orange", borderWidth: 1}} imageHeight={300} accessibilityLabel={accessibilityLabel} text={label} assetId={assetId} thumbHash={thumbHash} />
      )
    }

}
  return (
    <View style={{width: "100%", height: "100%"}}>
      <MyScrollView>
        {renderCanteens}
        <Text>{JSON.stringify(resources, null, 2)}</Text>
      </MyScrollView>
    </View>
  );
}
