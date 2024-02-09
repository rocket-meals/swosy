import {View} from '@/components/Themed';
import {useSynchedFoods} from "@/states/SynchedFoods";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {MyGridList} from "@/components/grid/MyGridList";
import {Foods} from "@/helper/database/databaseTypes/types";

export default function CardListTestScreen() {
  const [resources, setResources, lastUpdate] = useSynchedFoods();


  // define data type for grid list DataItem<Foods>[] = [{key: string, data: Foods}]
  let data: { key: string; data: Foods }[] = []
    if(resources) {
        let foodKeys = Object.keys(resources)
        foodKeys.forEach((key) => {
            let food = resources[key]
            data.push({key: key, data: food})
        })
    }

    const renderItem = ({ item }: { item: { key: string; data: Foods } }) => {
        const title: string = item.data?.alias || "No name"

        return (
            <MyCardForResourcesWithImage
                key={item.key}
                text={title}
                assetId={item.data.image}
                onPress={() => console.log("Pressed")}
             accessibilityLabel={title}/>
        );
    }

  return (
    <View style={{width: "100%", height: "100%"}}>
        <MyGridList data={data} renderItem={renderItem} gridAmount={2} flexDirection="row" />;
    </View>
  );
}
