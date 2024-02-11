import {View, Text} from '@/components/Themed';
import {useSynchedFoods} from "@/states/SynchedFoods";
import {MyGridList} from "@/components/grid/MyGridList";
import {Foods} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {ListRenderItemInfo, SafeAreaView} from "react-native";
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
            <View style={
                {
                    width: "100%",
                    height: "100%",
                    backgroundColor: "red",
                }
            }>
                <MyCardForResourcesWithImage
                    key={item.key}
                    text={title}
                    assetId={item.data.image}
                    onPress={() => console.log("Pressed")}
                    accessibilityLabel={title}/>
            </View>
        );
    }


/**
    const renderItem = (info: ListRenderItemInfo<DataItem>) => {
        const {item, index} = info;

        return (
            <View
                key={item.key}
                style={{
                    width: 500,
                    height: 500,
                    backgroundColor: "red",
                }}
            >
                <Text>{item.key}</Text>
                <Text>{item.data.alias}</Text>
            </View>
        );
    }
        */

  return (
    <MySafeAreaView>
        <MyGridList data={data} renderItem={renderItem} gridAmount={2} flexDirection="row" />
    </MySafeAreaView>
  );
}
