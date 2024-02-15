import {ListRenderItemInfo, StyleSheet} from 'react-native';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {DirectusFiles, Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {View} from "@/components/Themed";

export default function FoodOfferScreen() {

  const [foodOffers, setFoodOffers] = useFoodOffersForSelectedDate();

  const initialAmountColumns = useMyGridListDefaultColumns();

  type DataItem = { key: string; data: Foodoffers }

  let data: DataItem[] = []
  if(foodOffers) {
    for (let i = 0; i < foodOffers.length; i++) {
      const foodOffer = foodOffers[i];
      data.push({
        key: foodOffer.id + "", data: foodOffer
      })
    }
  }

    const renderItem = (info: ListRenderItemInfo<DataItem>) => {
      const {item, index} = info;
      const foodOffer = item.data;
      const food = foodOffer.food;
      let title = foodOffer.id+""
      let assetId: string | DirectusFiles | undefined = undefined
      if(typeof food !== "string"){
        assetId = food?.image
        title = food?.alias
      }


      return (
          <MyCardForResourcesWithImage
              key={item.key}
              text={title}
              assetId={assetId}
              onPress={() => console.log("Pressed")}
              accessibilityLabel={title}/>
      );
    }

    return (
        <MySafeAreaView>
          <MyGridFlatList
              spacing={{
                marginTop: 10,
                marginOuter: 0,
                marginInner: 5,
                marginRow: 10,
              }}
              data={data} renderItem={renderItem} gridAmount={initialAmountColumns} />
        </MySafeAreaView>
    );
  }