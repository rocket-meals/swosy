import {useSynchedFoods} from "@/states/SynchedFoods";
import {MyGridList} from "@/components/grid/MyGridList";
import {Foods} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {ListRenderItemInfo} from "react-native";
import {MySafeAreaView} from "@/components/MySafeAreaView";

export default function CardListTestScreen() {
  const [resources, setResources, lastUpdate] = useSynchedFoods();


  // define data type for grid list DataItem<Foods>[] = [{key: string, data: Foods}]
    type DataItem = { key: string; data: Foods }

  let data: DataItem[] = []
    if(resources) {
        let foodKeys = Object.keys(resources)
        foodKeys.forEach((key) => {
            let food = resources[key]
            data.push({key: key, data: food})
        })
    }


     const renderItem = (info: ListRenderItemInfo<DataItem>) => {
     const {item, index} = info;
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
    <MySafeAreaView>
        <MyGridList data={data} renderItem={renderItem} gridAmount={2} />
    </MySafeAreaView>
  );
}
